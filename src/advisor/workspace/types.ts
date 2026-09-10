import type { CaseState } from '../../types'

export interface ClientMeta {
  id: string
  name: string
  year: number
  language: 'en' | 'de'
  email: string
  city: string
  joined: string
  notes: string
  history: string[]
}

export interface WorkspaceCase {
  client: ClientMeta
  state: CaseState
  deadline: string
  lastActivity: string
  unread: boolean
  special?: 'on-hold' | 'extension-filed'
}

export interface ActivityEvent {
  id: string
  caseId: string
  at: string
  text: string // e.g. "Verified Photo ID. Jonas Brandt"
  itemId?: string
  type?: string
}

export interface AdvisorSettings {
  acceptingNewCases: boolean
  notifyClientUploads: boolean
  notifyQuestions: boolean
  notifyApprovals: boolean
}

export interface FollowUpTemplate {
  id: string
  label: string
  body: string // body contains "<item>"
}

export interface IncomingCaseRequest {
  id: string
  name: string
  city: string
  summary: string
  effort: string // e.g. "Straightforward, employee, one employer"
}

export interface WorkspaceState {
  cases: Record<string, WorkspaceCase>
  activity: ActivityEvent[]
  settings: AdvisorSettings
  templates: FollowUpTemplate[]
  incomingRequest?: IncomingCaseRequest
}
