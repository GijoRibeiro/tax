export type ItemStatus = 'needed' | 'uploaded' | 'verified' | 'issue'
export type ItemGroup = 'identity' | 'employment' | 'benefits' | 'deductions'

export interface ChecklistItem {
  id: string
  group: ItemGroup
  title: string
  germanName?: string
  explainer: string
  lookLike: string
  optional: boolean
  status: ItemStatus
  issueNote?: string
  uploadedFileName?: string
  uploadedAt?: string
}

export interface FollowUp {
  id: string
  itemId?: string
  from: 'advisor' | 'consumer'
  message: string
  createdAt: string
  status: 'open' | 'answered'
  reply?: string
}

export type CasePhase = 'onboarding' | 'sharing' | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'

export interface ReturnDraft {
  income: string
  taxPaid: string
  deductions: string
  refundEstimate: string
  note?: string
}

export interface CaseState {
  phase: CasePhase
  items: ChecklistItem[]
  followUps: FollowUp[]
  draft?: ReturnDraft
  filedAt?: string
  /** Set when the client presses "Send to Anna". Uploads before that are filled, not handed over. */
  submittedAt?: string
  /** Set at COMMIT_CASE: the platform matched an advisor with capacity. A slot, not her time. */
  matchedAt?: string
  /** Set with the send: the card is authorised (not charged) so advisor time is never spent unbacked. */
  cardLast4?: string
  cardHeldAt?: string
  /** Set at APPROVE_RETURN: the held amount is captured. Nothing is charged before consent. */
  chargedAt?: string
}

export const ADVISOR = {
  name: 'Anna Weber',
  title: 'Steuerberaterin',
  responsePromise: 'Replies within 1 business day',
  initials: 'AW',
} as const
