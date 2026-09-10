import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import { reducer as caseReducer, seedState } from '../../store/state'
import type { Action } from '../../store/state'
import { useCase } from '../../store/CaseStore'
import { seedWorkspace } from './seedWorkspace'
import type {
  WorkspaceState,
  WorkspaceCase,
  ActivityEvent,
  AdvisorSettings,
  FollowUpTemplate,
} from './types'

export const STORAGE_KEY = 'taxfix-advisor-workspace-v2'

// --- internal reducer -------------------------------------------------

type WsAction =
  | { type: 'CASE_ACTION'; caseId: string; action: Action }
  | { type: 'MARK_READ'; caseId: string }
  | { type: 'UPDATE_NOTES'; clientId: string; notes: string }
  | { type: 'REOPEN_CASE'; caseId: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<AdvisorSettings> }
  | { type: 'SAVE_TEMPLATE'; template: FollowUpTemplate }
  | { type: 'DELETE_TEMPLATE'; id: string }
  | { type: 'ACCEPT_REQUEST' }
  | { type: 'DECLINE_REQUEST' }
  | { type: 'REPLACE'; state: WorkspaceState }

function humanize(type: string): string {
  const s = type.toLowerCase().replace(/_/g, ' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function itemTitle(c: WorkspaceCase, itemId: string): string {
  return c.state.items.find(item => item.id === itemId)?.title ?? itemId
}

function activityText(action: Action, c: WorkspaceCase): string {
  switch (action.type) {
    case 'UPLOAD_ITEM':
      return `Client uploaded ${itemTitle(c, action.itemId)}`
    case 'VERIFY_ITEM':
      return `Verified ${itemTitle(c, action.itemId)}`
    case 'FLAG_ISSUE':
      return `Flagged ${itemTitle(c, action.itemId)}`
    case 'SEND_FOLLOW_UP':
      return `Asked ${c.client.name.split(' ')[0]} a question`
    case 'ANSWER_FOLLOW_UP':
      return 'Replied'
    case 'START_PREPARING':
      return 'Started preparing'
    case 'SEND_DRAFT':
      return 'Sent draft for review'
    case 'MARK_FILED':
      return 'Filed'
    default:
      return humanize(action.type)
  }
}

function itemIdOf(action: Action): string | undefined {
  return 'itemId' in action ? action.itemId : undefined
}

function wsReducer(state: WorkspaceState, action: WsAction): WorkspaceState {
  switch (action.type) {
    case 'CASE_ACTION': {
      const c = state.cases[action.caseId]
      if (!c) return state
      const now = new Date().toISOString()
      const event: ActivityEvent = {
        id: crypto.randomUUID(),
        caseId: action.caseId,
        at: now,
        text: activityText(action.action, c),
        itemId: itemIdOf(action.action),
        type: action.action.type,
      }
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.caseId]: { ...c, state: caseReducer(c.state, action.action), lastActivity: now },
        },
        activity: [event, ...state.activity],
      }
    }

    case 'MARK_READ': {
      const c = state.cases[action.caseId]
      if (!c) return state
      return { ...state, cases: { ...state.cases, [action.caseId]: { ...c, unread: false } } }
    }

    case 'UPDATE_NOTES': {
      const c = state.cases[action.clientId]
      if (!c) return state
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.clientId]: { ...c, client: { ...c.client, notes: action.notes } },
        },
      }
    }

    case 'REOPEN_CASE': {
      const c = state.cases[action.caseId]
      if (!c) return state
      const now = new Date().toISOString()
      const { special: _special, ...caseWithoutSpecial } = c
      const event: ActivityEvent = {
        id: crypto.randomUUID(),
        caseId: action.caseId,
        at: now,
        text: 'Reopened case',
      }
      return {
        ...state,
        cases: {
          ...state.cases,
          [action.caseId]: { ...caseWithoutSpecial, lastActivity: now },
        },
        activity: [event, ...state.activity],
      }
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } }

    case 'SAVE_TEMPLATE': {
      const exists = state.templates.some(t => t.id === action.template.id)
      const templates = exists
        ? state.templates.map(t => (t.id === action.template.id ? action.template : t))
        : [...state.templates, action.template]
      return { ...state, templates }
    }

    case 'DELETE_TEMPLATE':
      return { ...state, templates: state.templates.filter(t => t.id !== action.id) }

    case 'ACCEPT_REQUEST': {
      const req = state.incomingRequest
      if (!req) return state
      const caseId = req.id.startsWith('req-') ? req.id.slice(4) : req.id
      const emailLocal = req.name
        .toLowerCase()
        .replace(/[^a-z]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
      const now = new Date().toISOString()
      const newCase: WorkspaceCase = {
        client: {
          id: caseId,
          name: req.name,
          year: 2025,
          language: 'en',
          email: `${emailLocal}@example.com`,
          city: req.city,
          joined: now.slice(0, 10),
          notes: req.summary,
          history: [],
        },
        state: { ...seedState(), phase: 'sharing' },
        deadline: '2026-07-31',
        lastActivity: now,
        unread: false,
      }
      const rest = { ...state }
      delete rest.incomingRequest
      return { ...rest, cases: { ...state.cases, [caseId]: newCase } }
    }

    case 'DECLINE_REQUEST': {
      const rest = { ...state }
      delete rest.incomingRequest
      return rest
    }

    case 'REPLACE':
      return action.state

    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

function isWorkspaceState(v: unknown): v is WorkspaceState {
  if (!v || typeof v !== 'object') return false
  const s = v as WorkspaceState
  return (
    !!s.cases &&
    typeof s.cases === 'object' &&
    Array.isArray(s.activity) &&
    Array.isArray(s.templates)
  )
}

function loadInitial(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedWorkspace()
    const parsed: unknown = JSON.parse(raw)
    return isWorkspaceState(parsed) ? parsed : seedWorkspace()
  } catch {
    return seedWorkspace()
  }
}

// --- context ------------------------------------------------------------

interface WorkspaceCtx {
  ws: WorkspaceState
  dispatchCase: (caseId: string, action: Action) => void
  markRead: (caseId: string) => void
  updateNotes: (clientId: string, notes: string) => void
  reopenCase: (caseId: string) => void
  updateSettings: (patch: Partial<AdvisorSettings>) => void
  saveTemplate: (t: FollowUpTemplate) => void
  deleteTemplate: (id: string) => void
  acceptRequest: () => void
  declineRequest: () => void
  resetWorkspace: () => void
  liveConnected: boolean
}

const Ctx = createContext<WorkspaceCtx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { state: relayState, dispatch: relayDispatch, connected } = useCase()
  const [state, dispatch] = useReducer(wsReducer, undefined, loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage unavailable (private mode, quota, etc.), persistence is best-effort */
    }
  }, [state])

  const dispatchCase = useCallback(
    (caseId: string, action: Action) => {
      if (caseId === 'amara') {
        relayDispatch(action)
        return
      }
      dispatch({ type: 'CASE_ACTION', caseId, action })
    },
    [relayDispatch],
  )

  const markRead = useCallback((caseId: string) => dispatch({ type: 'MARK_READ', caseId }), [])
  const updateNotes = useCallback(
    (clientId: string, notes: string) => dispatch({ type: 'UPDATE_NOTES', clientId, notes }),
    [],
  )
  const updateSettings = useCallback(
    (patch: Partial<AdvisorSettings>) => dispatch({ type: 'UPDATE_SETTINGS', patch }),
    [],
  )
  const saveTemplate = useCallback(
    (t: FollowUpTemplate) => dispatch({ type: 'SAVE_TEMPLATE', template: t }),
    [],
  )
  const deleteTemplate = useCallback((id: string) => dispatch({ type: 'DELETE_TEMPLATE', id }), [])
  const reopenCase = useCallback((caseId: string) => dispatch({ type: 'REOPEN_CASE', caseId }), [])
  const acceptRequest = useCallback(() => dispatch({ type: 'ACCEPT_REQUEST' }), [])
  const declineRequest = useCallback(() => dispatch({ type: 'DECLINE_REQUEST' }), [])
  // Replaces only the local WorkspaceState reducer's data with a fresh seed, the live
  // Betina case is relay-backed (see dispatchCase above) and is deliberately left untouched;
  // resetting it would require a separate RESET dispatch through useCase().
  const resetWorkspace = useCallback(() => dispatch({ type: 'REPLACE', state: seedWorkspace() }), [])

  const value = useMemo<WorkspaceCtx>(() => {
    const amara = state.cases.amara
    const cases = amara ? { ...state.cases, amara: { ...amara, state: relayState } } : state.cases
    return {
      ws: { ...state, cases },
      dispatchCase,
      markRead,
      updateNotes,
      reopenCase,
      updateSettings,
      saveTemplate,
      deleteTemplate,
      acceptRequest,
      declineRequest,
      resetWorkspace,
      liveConnected: connected,
    }
  }, [
    state,
    relayState,
    connected,
    dispatchCase,
    markRead,
    updateNotes,
    reopenCase,
    updateSettings,
    saveTemplate,
    deleteTemplate,
    acceptRequest,
    declineRequest,
    resetWorkspace,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useWorkspace() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return ctx
}
