import { useState } from 'react'
import { TOKEN_DEFS, TOKEN_GROUPS, TOKEN_PRESETS } from '../design/tokens'
import { Button } from '../components/Button'
import { useCase } from '../store/CaseStore'

function format(kind: string, value: number) {
  return kind === 'scale' ? `${value}%` : `${value}px`
}

export function TokenEditor() {
  // Inputs are uncontrolled (defaultValue) so dragging doesn't fight the live token
  // write on every keystroke. Reset and presets remount the grid (via key) to resync
  // the controls' displayed values with the CSS variables.
  const [editorEpoch, setEditorEpoch] = useState(0)
  const [readouts, setReadouts] = useState<Record<string, number>>({})
  const { sendToken, resetTokensLive } = useCase()

  const handleReset = () => {
    resetTokensLive()
    setReadouts({})
    setEditorEpoch(e => e + 1)
  }
  const applyPreset = (values: Record<string, string>) => {
    resetTokensLive()
    for (const [cssVar, value] of Object.entries(values)) sendToken(cssVar, value)
    setReadouts({})
    setEditorEpoch(e => e + 1)
  }

  return (
    <div className="tf-token-editor">
      <div className="tf-token-editor__presets" role="group" aria-label="Presets">
        <button type="button" className="tf-token-editor__preset tf-token-editor__preset--home" onClick={handleReset}>Taxfix</button>
        {TOKEN_PRESETS.map(p => (
          <button type="button" key={p.name} className="tf-token-editor__preset" title={p.hint} onClick={() => applyPreset(p.values)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="tf-token-editor__grid" key={editorEpoch}>
        {TOKEN_GROUPS.map(group => (
          <div className="tf-token-editor__group" key={group}>
            <p className="tf-token-editor__group-title">{group}</p>
            {TOKEN_DEFS.filter(t => t.group === group).map(token => {
              const id = `token-${token.cssVar}`
              const base = token.kind === 'scale' ? Math.round(parseFloat(token.value) * 100) : parseInt(token.value, 10)
              const shown = readouts[token.cssVar] ?? base
              return (
                <div className="tf-token-editor__row" key={token.cssVar}>
                  <label htmlFor={id}>
                    {token.label}
                    <small>{token.hint}</small>
                  </label>
                  {token.kind === 'color' ? (
                    <input id={id} type="color" defaultValue={token.value} onChange={e => sendToken(token.cssVar, e.target.value)} />
                  ) : (
                    <span className="tf-token-editor__range">
                      <input
                        id={id}
                        type="range"
                        min={token.min}
                        max={token.max}
                        defaultValue={base}
                        onChange={e => {
                          const n = Number(e.target.value)
                          setReadouts(r => ({ ...r, [token.cssVar]: n }))
                          sendToken(token.cssVar, token.kind === 'scale' ? String(n / 100) : `${n}px`)
                        }}
                      />
                      <output htmlFor={id}>{format(token.kind, shown)}</output>
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <Button variant="secondary" onClick={handleReset}>
        Back to Taxfix tokens
      </Button>
    </div>
  )
}
