import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { reducer, seedState } from './state'
import type { Action } from './state'
import { reduceStakeholders, seedStakeholders, isStakeholderState } from './stakeholders'
import type { StakeholderAction, StakeholderState } from './stakeholders'
import type { CaseState } from '../types'
import { applyTokenOverrides, setToken, resetTokens } from '../design/tokens'

// The relay only ever runs on the presenter's machine. A deployed copy must not reach for
// 127.0.0.1 (Chrome asks visitors to allow "access to other apps on this device"), so it
// goes straight to its offline states unless the URL says ?relay=local.
function defaultRelayUrl(): string | null {
  if (import.meta.env.MODE === 'test') return null
  if (typeof window === 'undefined') return null
  const host = window.location.hostname
  const local = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')
  const forced = new URLSearchParams(window.location.search).get('relay') === 'local'
  return local || forced ? 'ws://127.0.0.1:8787' : null
}
const DEFAULT_URL = defaultRelayUrl()

interface CaseCtx {
  state: CaseState
  dispatch: (a: Action) => void
  connected: boolean
  sendToken: (cssVar: string, value: string) => void
  resetTokensLive: () => void
  /** Ask the local relay to open a source file in the editor. No-op when the relay is not there (deployed). */
  openSource: (file: string) => boolean
  /** Stakeholder interview transcripts (Betina / Anna), carried on the same socket. */
  stakeholders: StakeholderState
  dispatchStakeholder: (a: StakeholderAction) => void
}

const Ctx = createContext<CaseCtx | null>(null)

function isCaseState(v: unknown): v is CaseState {
  return !!v && typeof v === 'object' && Array.isArray((v as CaseState).items) && Array.isArray((v as CaseState).followUps)
}

export function CaseStoreProvider({ children, url = DEFAULT_URL }: { children: ReactNode; url?: string | null }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, seedState)
  const [stakeholders, rawDispatchStakeholder] = useReducer(reduceStakeholders, undefined, seedStakeholders)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!url) return
    let closed = false
    let retry: ReturnType<typeof setTimeout>
    let ws: WebSocket
    const connect = () => {
      // Bind each handler to this specific socket instance (not the outer
      // mutable `ws`/`wsRef` variables) so a stale socket left over from a
      // React StrictMode double-mount can't act on shared state once a newer
      // socket has taken over, its async onclose/onopen/onmessage events
      // are ignored once `wsRef.current` no longer points at it.
      const socket = new WebSocket(url)
      ws = socket
      wsRef.current = socket
      socket.onopen = () => {
        if (wsRef.current !== socket) return
        setConnected(true)
      }
      socket.onmessage = e => {
        if (wsRef.current !== socket) return
        try {
          const msg = JSON.parse(String(e.data))
          if (msg.kind === 'state' && isCaseState(msg.state)) rawDispatch({ type: 'REPLACE', state: msg.state })
          if (msg.kind === 'tokens' && msg.overrides) applyTokenOverrides(msg.overrides)
          if (msg.kind === 'stakeholders' && isStakeholderState(msg.state)) {
            rawDispatchStakeholder({ type: 'REPLACE_STAKEHOLDERS', state: msg.state })
          }
        } catch { /* malformed frame, ignore */ }
      }
      socket.onclose = () => {
        if (wsRef.current !== socket) return
        setConnected(false)
        wsRef.current = null
        if (!closed) retry = setTimeout(connect, 1000)
      }
    }
    connect()
    return () => { closed = true; clearTimeout(retry); ws.close() }
  }, [url])

  const live = useCallback(() => {
    const ws = wsRef.current
    return ws && ws.readyState === WebSocket.OPEN ? ws : null
  }, [])

  const dispatch = useCallback((a: Action) => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'action', action: a }))
    else rawDispatch(a)
  }, [live])

  const dispatchStakeholder = useCallback((a: StakeholderAction) => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'action', action: a }))
    else rawDispatchStakeholder(a)
  }, [live])

  const sendToken = useCallback((cssVar: string, value: string) => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'token', cssVar, value }))
    else setToken(cssVar, value)
  }, [live])

  const openSource = useCallback((file: string) => {
    const ws = live()
    if (!ws) return false
    ws.send(JSON.stringify({ kind: 'open', file }))
    return true
  }, [live])

  const resetTokensLive = useCallback(() => {
    const ws = live()
    if (ws) ws.send(JSON.stringify({ kind: 'token-reset' }))
    else resetTokens()
  }, [live])

  const value = useMemo(
    () => ({ state, dispatch, connected, sendToken, resetTokensLive, openSource, stakeholders, dispatchStakeholder }),
    [state, dispatch, connected, sendToken, resetTokensLive, openSource, stakeholders, dispatchStakeholder],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCase() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCase must be used inside CaseStoreProvider')
  return ctx
}
