import { useCallback, useMemo } from 'react'
import { useCase } from '../store/CaseStore'
import { pendingQuestion } from '../store/stakeholders'
import type { PersonaId, StakeholderMessage, StakeholderState } from '../store/stakeholders'

export interface StakeholdersApi {
  state: StakeholderState
  online: boolean
  pending: (persona: PersonaId) => StakeholderMessage | null
  ask: (persona: PersonaId, text: string) => void
  reset: (persona: PersonaId) => void
}

/** The two interviewable personas, over the same relay socket as the case. */
export function useStakeholders(): StakeholdersApi {
  const { stakeholders, dispatchStakeholder, connected } = useCase()
  const pending = useCallback((persona: PersonaId) => pendingQuestion(stakeholders, persona), [stakeholders])
  const ask = useCallback((persona: PersonaId, text: string) => {
    if (!text.trim()) return
    dispatchStakeholder({ type: 'ASK_PERSONA', persona, text })
  }, [dispatchStakeholder])
  const reset = useCallback((persona: PersonaId) => dispatchStakeholder({ type: 'RESET_PERSONA', persona }), [dispatchStakeholder])
  return useMemo(() => ({ state: stakeholders, online: connected, pending, ask, reset }), [stakeholders, connected, pending, ask, reset])
}
