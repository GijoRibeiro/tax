import { StrictMode } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { vi } from 'vitest'
import { CaseStoreProvider, useCase } from './CaseStore'

function Probe() {
  const { state, dispatch, connected } = useCase()
  return (
    <div>
      <span data-testid="phase">{state.phase}</span>
      <span data-testid="connected">{String(connected)}</span>
      <button onClick={() => dispatch({ type: 'COMMIT_CASE' })}>commit</button>
    </div>
  )
}

test('offline store reduces locally (test mode has no socket)', () => {
  render(<CaseStoreProvider><Probe /></CaseStoreProvider>)
  expect(screen.getByTestId('phase').textContent).toBe('onboarding')
  expect(screen.getByTestId('connected').textContent).toBe('false')
  fireEvent.click(screen.getByText('commit'))
  expect(screen.getByTestId('phase').textContent).toBe('sharing')
})

test('sendToken falls back to local css var when offline', () => {
  function TokenProbe() {
    const { sendToken } = useCase()
    return <button onClick={() => sendToken('--color-primary', '#123456')}>set</button>
  }
  render(<CaseStoreProvider><TokenProbe /></CaseStoreProvider>)
  fireEvent.click(screen.getByText('set'))
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#123456')
})

test('stale socket from a StrictMode double-mount cannot clobber the live connection', () => {
  const sockets: FakeSocket[] = []

  class FakeSocket {
    static CONNECTING = 0
    static OPEN = 1
    static CLOSING = 2
    static CLOSED = 3
    readyState = FakeSocket.CONNECTING
    onopen: (() => void) | null = null
    onmessage: ((e: { data: string }) => void) | null = null
    onclose: (() => void) | null = null
    sent: string[] = []
    url: string
    constructor(url: string) {
      this.url = url
      sockets.push(this)
    }
    send(data: string) {
      this.sent.push(data)
    }
    close() {
      // Real close events arrive asynchronously, a test-triggered onclose()
      // call (below) simulates that arrival independently of this call.
      this.readyState = FakeSocket.CLOSING
    }
  }

  vi.stubGlobal('WebSocket', FakeSocket)

  render(
    <StrictMode>
      <CaseStoreProvider url="ws://fake-relay">
        <Probe />
      </CaseStoreProvider>
    </StrictMode>,
  )

  // StrictMode's dev-only mount -> cleanup -> remount produces one abandoned
  // (stale) socket and one live (current) socket, synchronously.
  expect(sockets.length).toBe(2)
  const [stale, live] = sockets

  // The current (second) socket finishes connecting first.
  live.readyState = FakeSocket.OPEN
  act(() => { live.onopen?.() })
  expect(screen.getByTestId('connected').textContent).toBe('true')

  // Then the abandoned (first) socket's close event arrives late.
  act(() => { stale.onclose?.() })

  // The stale close must not have clobbered the live connection.
  expect(screen.getByTestId('connected').textContent).toBe('true')

  fireEvent.click(screen.getByText('commit'))
  expect(live.sent).toHaveLength(1)
  expect(JSON.parse(live.sent[0])).toEqual({ kind: 'action', action: { type: 'COMMIT_CASE' } })
  expect(stale.sent).toHaveLength(0)

  vi.unstubAllGlobals()
})

test('stakeholder chats reduce locally when offline and follow relay frames when live', () => {
  function ShProbe() {
    const { stakeholders, dispatchStakeholder } = useCase()
    return (
      <div>
        <span data-testid="amara-count">{stakeholders.amara.length}</span>
        <span data-testid="amara-last">{stakeholders.amara.at(-1)?.text ?? ''}</span>
        <button onClick={() => dispatchStakeholder({ type: 'ASK_PERSONA', persona: 'amara', text: 'Hello?' })}>ask</button>
      </div>
    )
  }
  render(<CaseStoreProvider><ShProbe /></CaseStoreProvider>)
  const before = Number(screen.getByTestId('amara-count').textContent)
  fireEvent.click(screen.getByText('ask'))
  expect(Number(screen.getByTestId('amara-count').textContent)).toBe(before + 1)
  expect(screen.getByTestId('amara-last').textContent).toBe('Hello?')
})

test('a stakeholders frame from the relay replaces the local transcript', () => {
  const sockets: any[] = []
  class FakeSocket {
    static OPEN = 1
    readyState = 0
    onopen: (() => void) | null = null
    onmessage: ((e: { data: string }) => void) | null = null
    onclose: (() => void) | null = null
    sent: string[] = []
    url: string
    constructor(url: string) { this.url = url; sockets.push(this) }
    send(d: string) { this.sent.push(d) }
    close() { this.readyState = 2 }
  }
  vi.stubGlobal('WebSocket', FakeSocket)
  function ShProbe() {
    const { stakeholders, dispatchStakeholder } = useCase()
    return (
      <div>
        <span data-testid="anna-last">{stakeholders.anna.at(-1)?.text ?? ''}</span>
        <button onClick={() => dispatchStakeholder({ type: 'ASK_PERSONA', persona: 'anna', text: 'Busy?' })}>ask</button>
      </div>
    )
  }
  render(<CaseStoreProvider url="ws://fake-relay"><ShProbe /></CaseStoreProvider>)
  const sock = sockets[0]
  sock.readyState = FakeSocket.OPEN
  act(() => { sock.onopen?.() })
  act(() => {
    sock.onmessage?.({ data: JSON.stringify({ kind: 'stakeholders', state: {
      amara: [], anna: [{ id: 'a1', role: 'persona', text: 'Always in July.', at: '2026-09-05T10:00:00.000Z' }],
    } }) })
  })
  expect(screen.getByTestId('anna-last').textContent).toBe('Always in July.')
  fireEvent.click(screen.getByText('ask'))
  expect(JSON.parse(sock.sent.at(-1))).toEqual({ kind: 'action', action: { type: 'ASK_PERSONA', persona: 'anna', text: 'Busy?' } })
  vi.unstubAllGlobals()
})
