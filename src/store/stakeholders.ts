// Stakeholder interviews: two personas (Betina the filer, Anna the advisor) and
// their chat transcripts. Pure, like state.ts: the relay runs this exact module
// and the web app reduces the same actions locally when the socket is down.
//
// Answers are NOT produced here. They come from the presenter's Claude Code
// session (scripts/stakeholders.mjs reply …), which reads docs/personas/*.md.
import seed from '../../server/stakeholders.seed.json' with { type: 'json' }

export type PersonaId = 'amara' | 'anna'
export const PERSONA_IDS: readonly PersonaId[] = ['amara', 'anna']

export interface StakeholderMessage {
  id: string
  role: 'interviewer' | 'persona'
  text: string
  at: string
}

export type StakeholderState = Record<PersonaId, StakeholderMessage[]>

export type StakeholderAction =
  | { type: 'ASK_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'ANSWER_PERSONA'; persona: PersonaId; text: string; id?: string; at?: string }
  | { type: 'RESET_PERSONA'; persona: PersonaId }
  | { type: 'RESET_STAKEHOLDERS' }
  | { type: 'REPLACE_STAKEHOLDERS'; state: StakeholderState }

/** Action types a client may send over the relay. REPLACE is server→client only. */
export const STAKEHOLDER_ACTION_TYPES: ReadonlySet<string> = new Set([
  'ASK_PERSONA',
  'ANSWER_PERSONA',
  'RESET_PERSONA',
  'RESET_STAKEHOLDERS',
])

function isMessage(v: unknown): v is StakeholderMessage {
  if (!v || typeof v !== 'object') return false
  const m = v as Record<string, unknown>
  return typeof m.id === 'string' && (m.role === 'interviewer' || m.role === 'persona')
    && typeof m.text === 'string' && typeof m.at === 'string'
}

export function isStakeholderState(v: unknown): v is StakeholderState {
  if (!v || typeof v !== 'object') return false
  return PERSONA_IDS.every(p => {
    const list = (v as Record<string, unknown>)[p]
    return Array.isArray(list) && list.every(isMessage)
  })
}

export function seedStakeholders(): StakeholderState {
  const s = seed as unknown
  if (!isStakeholderState(s)) throw new Error('server/stakeholders.seed.json is malformed')
  return { amara: s.amara.map(m => ({ ...m })), anna: s.anna.map(m => ({ ...m })) }
}

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function append(
  state: StakeholderState,
  persona: PersonaId,
  role: StakeholderMessage['role'],
  a: { text: string; id?: string; at?: string },
): StakeholderState {
  const text = a.text.trim()
  if (!text) return state
  const msg: StakeholderMessage = {
    id: a.id ?? newId(role === 'interviewer' ? 'q' : 'a'),
    role,
    text,
    at: a.at ?? new Date().toISOString(),
  }
  return { ...state, [persona]: [...state[persona], msg] }
}

export function reduceStakeholders(state: StakeholderState, action: StakeholderAction): StakeholderState {
  switch (action.type) {
    case 'ASK_PERSONA':
      return append(state, action.persona, 'interviewer', action)
    case 'ANSWER_PERSONA':
      return append(state, action.persona, 'persona', action)
    case 'RESET_PERSONA':
      return { ...state, [action.persona]: seedStakeholders()[action.persona] }
    case 'RESET_STAKEHOLDERS':
      return seedStakeholders()
    case 'REPLACE_STAKEHOLDERS':
      return action.state
    default:
      return state
  }
}

/** The question the persona still owes an answer to, if the interviewer spoke last. */
export function pendingQuestion(state: StakeholderState, persona: PersonaId): StakeholderMessage | null {
  const list = state[persona]
  const last = list[list.length - 1]
  return last && last.role === 'interviewer' ? last : null
}
