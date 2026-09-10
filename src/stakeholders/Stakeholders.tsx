import { useSearchParams } from 'react-router-dom'
import { useStakeholders } from './useStakeholders'
import { PERSONAS, PERSONA_ORDER } from './personas'
import { PersonaColumn } from './PersonaColumn'
import './stakeholders.css'

// Two interviewable personas side by side. Questions go over the relay;
// answers come from the presenter's Claude Code session (see
// scripts/stakeholders.mjs). `?embed=1` drops the page header so the press deck
// can iframe the pair into a slide.
export function Stakeholders() {
  const [params] = useSearchParams()
  const embed = params.get('embed') === '1'
  const { state, online, pending, ask, reset } = useStakeholders()

  return (
    <div className={embed ? 'sh sh--embed' : 'sh'}>
      {!embed && (
        <header className="sh-page__header">
          <h1 className="sh-page__title">Talking to both sides</h1>
        </header>
      )}
      <div className="sh-columns">
        {PERSONA_ORDER.map(id => (
          <PersonaColumn
            key={id}
            persona={PERSONAS[id]}
            messages={state[id]}
            pending={pending(id)}
            online={online}
            onAsk={text => ask(id, text)}
            onReset={() => reset(id)}
          />
        ))}
      </div>
    </div>
  )
}
