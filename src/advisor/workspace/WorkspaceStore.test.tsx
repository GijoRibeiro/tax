import { render, act } from '@testing-library/react'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace, STORAGE_KEY } from './WorkspaceStore'
import { seedWorkspace } from './seedWorkspace'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderWorkspace() {
  let latest!: Ws
  render(
    <CaseStoreProvider url={null}>
      <WorkspaceProvider>
        <Probe
          onReady={ws => {
            latest = ws
          }}
        />
      </WorkspaceProvider>
    </CaseStoreProvider>,
  )
  return () => latest
}

beforeEach(() => {
  localStorage.clear()
})

test('dispatching to one case never mutates another', () => {
  const getWs = renderWorkspace()
  const beforeB = JSON.stringify(getWs().ws.cases['priya-nair'])

  // sabine-hoffmann keeps the checklist's default 'tax-id' status of 'uploaded', an
  // uploaded-but-unverified item from seed, so VERIFY_ITEM is a real state transition.
  act(() => {
    getWs().dispatchCase('sabine-hoffmann', { type: 'VERIFY_ITEM', itemId: 'tax-id' })
  })

  const ws = getWs().ws
  expect(JSON.stringify(ws.cases['priya-nair'])).toBe(beforeB)

  const item = ws.cases['sabine-hoffmann'].state.items.find(i => i.id === 'tax-id')
  expect(item?.status).toBe('verified')

  expect(ws.activity[0].caseId).toBe('sabine-hoffmann')
  expect(ws.activity[0].type).toBe('VERIFY_ITEM')
  expect(ws.activity[0].itemId).toBe('tax-id')
  expect(ws.activity[0].text).toContain('Your tax ID')
})

test('amara dispatch routes to relay dispatch, not local state', () => {
  const getWs = renderWorkspace()

  act(() => {
    getWs().dispatchCase('amara', { type: 'UPLOAD_ITEM', itemId: 'lohnsteuer', fileName: 'test.pdf' })
  })

  const item = getWs().ws.cases['amara'].state.items.find(i => i.id === 'lohnsteuer')
  expect(item?.status).toBe('uploaded')
  expect(item?.uploadedFileName).toBe('test.pdf')

  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  const storedItem = stored.cases.amara.state.items.find((i: { id: string }) => i.id === 'lohnsteuer')
  expect(storedItem.status).toBe('needed')
})

test('workspace persists and hydrates; corrupt storage falls back to seed', () => {
  const getWs = renderWorkspace()
  act(() => {
    getWs().dispatchCase('sabine-hoffmann', { type: 'VERIFY_ITEM', itemId: 'tax-id' })
  })
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  expect(stored.cases['sabine-hoffmann'].state.items.find((i: { id: string }) => i.id === 'tax-id').status).toBe(
    'verified',
  )

  localStorage.setItem(STORAGE_KEY, JSON.stringify({ garbage: 1 }))
  const getWs2 = renderWorkspace()
  const seedCount = Object.keys(seedWorkspace().cases).length
  expect(Object.keys(getWs2().ws.cases).length).toBe(seedCount)
})

test('template upsert and delete', () => {
  const getWs = renderWorkspace()

  act(() => {
    getWs().saveTemplate({ id: 't-new', label: 'New template', body: 'Please resend <item>.' })
  })
  expect(getWs().ws.templates.find(t => t.id === 't-new')?.label).toBe('New template')

  act(() => {
    getWs().saveTemplate({ id: 't-new', label: 'Updated template', body: 'Updated <item> body.' })
  })
  const matches = getWs().ws.templates.filter(t => t.id === 't-new')
  expect(matches).toHaveLength(1)
  expect(matches[0].label).toBe('Updated template')

  act(() => {
    getWs().deleteTemplate('t-gap')
  })
  expect(getWs().ws.templates.some(t => t.id === 't-gap')).toBe(false)
})

test('acceptRequest adds a workable case; declineRequest clears', () => {
  const getWs = renderWorkspace()
  expect(getWs().ws.incomingRequest).toBeDefined()
  const before = Object.keys(getWs().ws.cases).length

  act(() => {
    getWs().acceptRequest()
  })

  expect(getWs().ws.incomingRequest).toBeUndefined()
  expect(Object.keys(getWs().ws.cases).length).toBe(before + 1)
  const added = Object.values(getWs().ws.cases).find(c => c.client.name === 'Lena Fischer')
  expect(added).toBeDefined()
  expect(added?.deadline).toBe('2026-07-31')
  expect(added?.state.phase).toBe('sharing')
})

test('declineRequest clears the incoming request without adding a case', () => {
  const getWs = renderWorkspace()
  const before = Object.keys(getWs().ws.cases).length

  act(() => {
    getWs().declineRequest()
  })

  expect(getWs().ws.incomingRequest).toBeUndefined()
  expect(Object.keys(getWs().ws.cases).length).toBe(before)
})
