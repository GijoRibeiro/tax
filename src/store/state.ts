import type { ChecklistItem, CaseState, FollowUp, ReturnDraft } from '../types'

export function seedState(): CaseState {
  return {
    phase: 'onboarding',
    items: [
      {
        id: 'id-doc',
        group: 'identity',
        title: 'Photo ID',
        explainer: "A passport or national ID. Anna needs to confirm it's really you.",
        lookLike: 'The photo page of your passport.',
        optional: false,
        status: 'needed',
      },
      {
        id: 'tax-id',
        group: 'identity',
        title: 'Your tax ID',
        germanName: 'Steuer-ID',
        explainer: 'Your 11-digit Steuer-ID. Everyone in Germany gets one by post.',
        lookLike: 'A letter from the Bundeszentralamt für Steuern.',
        optional: false,
        status: 'needed',
      },
      {
        id: 'lohnsteuer',
        group: 'employment',
        title: 'Annual income statement',
        germanName: 'Lohnsteuerbescheinigung',
        explainer:
          'Your employer sent this in February, it summarises your salary and the tax you already paid.',
        lookLike: 'One page, a grid of numbered boxes.',
        optional: false,
        status: 'needed',
      },
      {
        id: 'alg-bescheid',
        group: 'benefits',
        title: 'Unemployment benefits statement',
        germanName: 'ALG‑I Leistungsbescheid',
        explainer:
          "The letter from the Agentur für Arbeit confirming your unemployment benefits. It's the reason your filing is required.",
        lookLike: "A letter titled 'Bewilligungsbescheid'.",
        optional: false,
        status: 'needed',
      },
      {
        id: 'bank',
        group: 'identity',
        title: 'Bank details for your refund',
        explainer: 'Where your refund should land. IBAN is enough.',
        lookLike: 'Your IBAN, from your banking app.',
        optional: false,
        status: 'needed',
      },
      {
        id: 'deductions',
        group: 'deductions',
        title: 'Receipts that could raise your refund',
        explainer: 'Work equipment, relocation costs, courses, optional, but often worth real money.',
        lookLike: 'Any receipts or invoices you kept.',
        optional: true,
        status: 'needed',
      },
    ],
    followUps: [],
  }
}

export type Action =
  | { type: 'UPLOAD_ITEM'; itemId: string; fileName: string }
  | { type: 'VERIFY_ITEM'; itemId: string }
  | { type: 'FLAG_ISSUE'; itemId: string; note: string }
  | { type: 'SEND_FOLLOW_UP'; itemId?: string; message: string }
  | { type: 'ASK_ADVISOR'; itemId: string; question: string }
  | { type: 'ANSWER_FOLLOW_UP'; followUpId: string; reply: string }
  | { type: 'ADD_ITEM'; item: Omit<ChecklistItem, 'status'> }
  | { type: 'RESET' }
  | { type: 'REPLACE'; state: CaseState }
  | { type: 'COMMIT_CASE' }
  | { type: 'SUBMIT_DOCUMENTS'; cardLast4: string }
  | { type: 'START_PREPARING' }
  | { type: 'SEND_DRAFT'; draft: ReturnDraft }
  | { type: 'APPROVE_RETURN' }
  | { type: 'MARK_FILED' }

export function reducer(state: CaseState, action: Action): CaseState {
  switch (action.type) {
    case 'UPLOAD_ITEM': {
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId
            ? {
                ...item,
                status: 'uploaded',
                uploadedFileName: action.fileName,
                uploadedAt: new Date().toISOString(),
                issueNote: undefined,
              }
            : item
        ),
      }
    }

    case 'VERIFY_ITEM': {
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId ? { ...item, status: 'verified' } : item
        ),
      }
    }

    case 'FLAG_ISSUE': {
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.itemId ? { ...item, status: 'issue', issueNote: action.note } : item
        ),
      }
    }

    case 'SEND_FOLLOW_UP': {
      const followUp: FollowUp = {
        id: crypto.randomUUID(),
        itemId: action.itemId,
        from: 'advisor',
        message: action.message,
        createdAt: new Date().toISOString(),
        status: 'open',
      }
      return {
        ...state,
        followUps: [...state.followUps, followUp],
      }
    }

    case 'ASK_ADVISOR': {
      const followUp: FollowUp = {
        id: crypto.randomUUID(),
        itemId: action.itemId,
        from: 'consumer',
        message: action.question,
        createdAt: new Date().toISOString(),
        status: 'open',
      }
      return {
        ...state,
        followUps: [...state.followUps, followUp],
      }
    }

    case 'ANSWER_FOLLOW_UP': {
      return {
        ...state,
        followUps: state.followUps.map(fu =>
          fu.id === action.followUpId ? { ...fu, status: 'answered', reply: action.reply } : fu
        ),
      }
    }

    case 'ADD_ITEM': {
      if (state.items.some(item => item.id === action.item.id)) return state
      const item: ChecklistItem = { ...action.item, status: 'needed' }
      return { ...state, items: [...state.items, item] }
    }

    // Start with Anna: the case exists and the advisor proposed at the result is reserved
    // (language, region, load). Betina sees a real name at once; Anna's time is untouched.
    case 'COMMIT_CASE':
      return { ...state, phase: 'sharing', matchedAt: new Date().toISOString() }

    // The send completes the hand-off: everything required is filled, a card is saved and
    // authorised (not charged), and the case changes hands. Anna starts only after this,
    // so her time is never spent on a client who cannot pay. A no-op until the last
    // required document is in or without a card.
    case 'SUBMIT_DOCUMENTS': {
      if (state.phase !== 'sharing' || !allRequiredFilled(state) || !action.cardLast4) return state
      const now = new Date().toISOString()
      return { ...state, submittedAt: now, cardLast4: action.cardLast4, cardHeldAt: now }
    }

    case 'START_PREPARING':
      return { ...state, phase: 'preparing' }

    case 'SEND_DRAFT':
      return { ...state, phase: 'awaiting_approval', draft: action.draft }

    // Consent first, then money: approving captures the held amount.
    case 'APPROVE_RETURN':
      return { ...state, phase: 'approved' , chargedAt: state.cardHeldAt ? new Date().toISOString() : undefined }

    case 'MARK_FILED':
      return { ...state, phase: 'filed', filedAt: new Date().toISOString() }

    case 'RESET': {
      return seedState()
    }

    case 'REPLACE': {
      return action.state
    }

    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}

export function requiredItems(s: CaseState): ChecklistItem[] {
  return s.items.filter(item => !item.optional)
}

export function sharedCount(s: CaseState): number {
  return s.items.filter(item => !item.optional && (item.status === 'uploaded' || item.status === 'verified')).length
}

/** Every required document is in the app. Not yet the hand-off: see `advisorCanStart`. */
export function allRequiredFilled(s: CaseState): boolean {
  const required = requiredItems(s)
  return required.every(item => item.status === 'uploaded' || item.status === 'verified')
}

/** Anna can start only once the client has pressed "Send to Anna" with everything in. */
export function advisorCanStart(s: CaseState): boolean {
  return allRequiredFilled(s) && Boolean(s.submittedAt)
}

export function openFollowUpsFor(s: CaseState, from: 'advisor' | 'consumer'): FollowUp[] {
  return s.followUps.filter(fu => fu.from === from && fu.status === 'open')
}

export type LiveCaseStatus =
  | 'onboarding' | 'waiting_on_client' | 'ready_to_work'
  | 'preparing' | 'awaiting_approval' | 'approved' | 'filed'

export function caseStatus(s: CaseState): LiveCaseStatus {
  if (s.phase === 'sharing') return advisorCanStart(s) ? 'ready_to_work' : 'waiting_on_client'
  return s.phase
}
