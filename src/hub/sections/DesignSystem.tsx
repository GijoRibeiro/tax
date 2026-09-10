import { TokenEditor } from '../TokenEditor'
import { Specimens } from './Specimens'

// The desk, small, as a live preview: its own page in an iframe, so it carries its own
// store and follows the relay's token broadcasts exactly like the real tab does.
function AdvisorAppPreview() {
  return <iframe className="hub-token-lab__frame" src="/advisor" title="Advisor dashboard preview" loading="lazy" />
}

const RULES = [
  { title: 'Tokens only.', body: 'Every colour, radius and shadow comes from tokens.css on the web and the generated Tokens.swift on iOS. A lint test in the suite fails on any literal outside those two files.' },
  { title: 'Components before markup.', body: 'A second hand-rolled button or card is a bug. New token or component means a catalog entry in the same change, with the screen it came from.' },
  { title: 'Flat.', body: 'No shadows. No borders except the selected card and hairline dividers. Tones separate surfaces: white page, cream cards, pale green chips.' },
  { title: 'A cream card means "tap me".', body: 'Reasons, benefits and facts never sit in a card; they are plain rows on the page. Before shipping a screen, ask of every cream shape what happens on tap.' },
  { title: 'One title line.', body: 'The title sits 56pt below the status bar on every screen, pushed or root. The home fills that row with its eyebrow. Only the splash and the chat differ, on purpose.' },
  { title: 'Plain English, in one read.', body: 'German terms are explained in the same sentence. The home headline is a sentence that knows where you are, with the ask in green.' },
]

const SWATCHES = [
  ['--color-ink', 'Headings, body'],
  ['--color-ink-soft', 'Secondary text, icons'],
  ['--color-surface-sunken', 'Taxfix cream: cards that tap'],
  ['--color-surface-muted', 'Chat canvas, dense panels'],
  ['--color-line', 'The only hairline'],
  ['--color-primary', 'Lime: the one primary button'],
  ['--color-accent', 'Dark green: links, text buttons'],
  ['--color-success', 'Check circles, the ask in the headline'],
  ['--color-info-bg', 'Green chips, active pills'],
  ['--color-lime-soft', 'Result block, filled chapters'],
  ['--color-pastel-lilac', 'You-are-here marker, avatars'],
  ['--color-pastel-orange', 'Avatars'],
]


export function DesignSystem() {
  return (
    <section id="design-system" className="hub-section">
      <h2 className="hub-section__title">Design system</h2>
      <p>
        One catalog, <code>docs/design/CATALOG.md</code>, derived from ten screens of the real Taxfix app and
        taxfix.de. It names the tokens, the components and six rules. The web reads the tokens from CSS variables,
        the iOS app from a generated Swift file, so a change lands on both. The rules are enforced, not hoped for:
        the test suite includes a design lint that fails the build on any colour or radius literal.
      </p>

      <h3 className="hub-section__subtitle">The six rules</h3>
      <ul className="hub-rules">
        {RULES.map(r => (
          <li key={r.title}>
            <strong>{r.title}</strong>
            {r.body}
          </li>
        ))}
      </ul>

      <h3 className="hub-section__subtitle">Customise the phone, live</h3>
      <p>
        Move a slider, or tap a preset, and the native app in the simulator restyles over the relay, no rebuild:
        colours, corners, button height, title size, and every label\'s size at once. The advisor desk on the right
        follows the same tokens. This is the governance claim made live instead of asserted: one token, every
        surface.
      </p>

      <div className="hub-token-lab">
        <TokenEditor />
        <div className="hub-token-lab__previews">
          <div className="hub-token-lab__preview">
            <div className="hub-token-lab__clip hub-token-lab__clip--advisor">
              <div className="hub-token-lab__scale hub-token-lab__scale--advisor">
                <AdvisorAppPreview />
              </div>
            </div>
            <span className="hub-token-lab__preview-label">Advisor dashboard</span>
          </div>
        </div>
      </div>
      <p className="hub-caption">One token: the phone in the simulator, the desk, this hub. Live.</p>

      <h3 className="hub-section__subtitle">Tokens, the ones that carry the look</h3>
      <div className="hub-swatches">
        {SWATCHES.map(([token, where]) => (
          <div className="hub-swatch" key={token}>
            <span className="hub-swatch__chip" style={{ background: `var(${token})` }} aria-hidden="true" />
            <code>{token}</code>
            <span>{where}</span>
          </div>
        ))}
      </div>

      <h3 className="hub-section__subtitle">The iOS components, rendered by the app itself</h3>
      <p>
        Every image below is a crop of the simulator, not a web re-drawing: a hidden gallery screen shows one
        component at a time and <code>npm run specimens</code> photographs them all. Tap one to open its Swift
        file; change it, ⌘R, and the simulator shows the new version.
      </p>
      <Specimens />

      <h3 className="hub-section__subtitle">The rules on the phone</h3>
      <div className="hub-shots">
        <figure>
          <img src="/screenshots/s1-home.png" alt="Home: chapter tiles, headline with the ask in green" />
          <figcaption>Cream tiles tap. The ask is in green. Anna one tap away.</figcaption>
        </figure>
        <figure>
          <img src="/screenshots/c2-pricing.png" alt="Pricing: money timeline and plain fact rows" />
          <figcaption>Facts as plain rows, not cards. One lime button.</figcaption>
        </figure>
        <figure>
          <img src="/screenshots/s3-item.png" alt="Document screen: tip rows and pinned actions" />
          <figcaption>Title on the shared line, tip rows, actions pinned in a blur.</figcaption>
        </figure>
        <figure>
          <img src="/screenshots/s5-send.png" alt="The hand-off screen: result block, card row, Send to Anna" />
          <figcaption>Result block, one card row, one primary. The hand-off.</figcaption>
        </figure>
      </div>

      <h3 className="hub-section__subtitle">Anna's desk, same family, quieter voice</h3>
      <p>
        The advisor app is built on a small kit of its own (catalog §5b): a cream header band with a light title
        and a row of numbers, a white body, white cards with a hairline, one lime action per page. The structure
        was borrowed from an editorial dashboard, the skin is Taxfix's, and the state-aware sentence comes from the
        phone. Hairlines are the desk's one departure from the phone's borderless rule, because white cards on a
        white body need an edge.
      </p>

    </section>
  )
}
