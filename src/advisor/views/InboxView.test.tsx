import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CaseStoreProvider } from '../../store/CaseStore'
import { WorkspaceProvider, useWorkspace } from '../workspace/WorkspaceStore'
import { SEED_TODAY } from '../workspace/seedWorkspace'
import { inboxItems } from '../workspace/selectors'
import { InboxView } from './InboxView'

type Ws = ReturnType<typeof useWorkspace>

function Probe({ onReady }: { onReady: (ws: Ws) => void }) {
  const ws = useWorkspace()
  onReady(ws)
  return null
}

function renderInbox(today: string = SEED_TODAY) {
  let latest!: Ws
  const utils = render(
    <MemoryRouter>
      <CaseStoreProvider url={null}>
        <WorkspaceProvider>
          <Probe onReady={ws => { latest = ws }} />
          <InboxView today={today} />
        </WorkspaceProvider>
      </CaseStoreProvider>
    </MemoryRouter>,
  )
  return { ...utils, getWs: () => latest }
}

beforeEach(() => {
  localStorage.clear()
})

test('groups seeded questions under "Needs your reply" and "Waiting on client"', () => {
  renderInbox()
  expect(screen.getByText('Needs your reply')).toBeInTheDocument()
  expect(screen.getByText('Waiting on client')).toBeInTheDocument()

  const replyRows = screen.getAllByTestId('inbox-reply-row')
  const waitingRows = screen.getAllByTestId('inbox-waiting-row')
  expect(replyRows.length).toBe(2) // jonas-brandt + elif-yildiz
  expect(waitingRows.length).toBe(3) // tobias-wagner + chen-wei + nadia-petrova
})

test('replying to one case answers only that case\'s follow-up, not another case\'s', () => {
  const { getWs } = renderInbox()

  const jonasRow = screen.getByText('Can I still add a receipt I forgot about?').closest('li') as HTMLElement
  const textarea = within(jonasRow).getByPlaceholderText('Write a reply')
  fireEvent.change(textarea, { target: { value: 'Sure, go ahead and add it.' } })
  fireEvent.click(within(jonasRow).getByText('Send reply'))

  const ws = getWs().ws
  const jonasFu = ws.cases['jonas-brandt'].state.followUps.find(f => f.id === 'fu-jonas-1')
  const elifFu = ws.cases['elif-yildiz'].state.followUps.find(f => f.id === 'fu-elif-1')

  expect(jonasFu?.status).toBe('answered')
  expect(jonasFu?.reply).toBe('Sure, go ahead and add it.')
  expect(elifFu?.status).toBe('open')
})

test('quick-reply button sends the canned reply to the correct case', () => {
  const { getWs } = renderInbox()

  const elifRow = screen.getByText('When can I expect an update on my filing?').closest('li') as HTMLElement
  const quickReply = within(elifRow).getByText(/Yes, this applies to you/)
  fireEvent.click(quickReply)

  const ws = getWs().ws
  const elifFu = ws.cases['elif-yildiz'].state.followUps.find(f => f.id === 'fu-elif-1')
  expect(elifFu?.status).toBe('answered')
  expect(elifFu?.reply).toContain('Yes, this applies to you')

  const jonasFu = ws.cases['jonas-brandt'].state.followUps.find(f => f.id === 'fu-jonas-1')
  expect(jonasFu?.status).toBe('open')
})

test('waiting rows show an item chip and a link to the case', () => {
  renderInbox()
  const tobiasRow = screen
    .getByText(/Could you resend your Lohnsteuerbescheinigung/)
    .closest('li') as HTMLElement
  expect(within(tobiasRow).getByText('Annual income statement')).toBeInTheDocument()
  const link = within(tobiasRow).getByRole('link', { name: /open case/i })
  expect(link.getAttribute('href')).toContain('/cases/')
  expect(link.getAttribute('href')).toContain('tobias-wagner')
})

test('a group heading is hidden entirely once that group empties out, while the other group stays visible', () => {
  const { getWs } = renderInbox()

  act(() => {
    const items = inboxItems(getWs().ws).filter(i => i.group === 'needs-reply')
    for (const entry of items) {
      getWs().dispatchCase(entry.caseId, {
        type: 'ANSWER_FOLLOW_UP',
        followUpId: entry.followUp.id,
        reply: 'Cleared for the group-hide test.',
      })
    }
  })

  expect(screen.queryByText('Needs your reply')).not.toBeInTheDocument()
  expect(screen.queryAllByTestId('inbox-reply-row').length).toBe(0)
  expect(screen.getByText('Waiting on client')).toBeInTheDocument()
  expect(screen.getAllByTestId('inbox-waiting-row').length).toBeGreaterThan(0)
})

test('empty inbox shows the "Inbox zero" empty state', () => {
  const { getWs } = renderInbox()

  act(() => {
    const items = inboxItems(getWs().ws)
    for (const entry of items) {
      getWs().dispatchCase(entry.caseId, {
        type: 'ANSWER_FOLLOW_UP',
        followUpId: entry.followUp.id,
        reply: 'Cleared for the empty-state test.',
      })
    }
  })

  expect(screen.getByText('Inbox zero')).toBeInTheDocument()
  expect(
    screen.getByText('Every question answered. Enjoy it while it lasts.'),
  ).toBeInTheDocument()
})
