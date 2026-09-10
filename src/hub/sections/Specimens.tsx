import { useState } from 'react'
import { useCase } from '../../store/CaseStore'
// The iOS components as real renders. Each image is a crop of the simulator, produced by
// `npm run specimens` (scripts/specimens.sh → ComponentGalleryView). Nothing here is
// re-drawn on the web, so what the hub shows is what the phone ships.
const SPECIMENS: { id: string; name: string; note: string; file: string }[] = [
  { id: 'primary-button', name: 'PrimaryButton', note: 'Lime, 56pt, radius 18. One per screen.' , file: 'ios/Sources/Views/Components/PrimaryButton.swift' },
  { id: 'secondary-and-icon', name: 'SecondaryButtonLabel + PrimaryIconButton', note: 'The wide cream secondary and the square lime primary, side by side.' , file: 'ios/Sources/Views/Components/PrimaryButton.swift' },
  { id: 'chips', name: 'Chip', note: 'Tones green, neutral, issue, indigo, and onLime for a filled tile.' , file: 'ios/Sources/Views/Components/Chip.swift' },
  { id: 'status-pills', name: 'StatusPillView', note: 'A document\'s state: to share, sent, checked, needs attention.' , file: 'ios/Sources/Views/Components/StatusPillView.swift' },
  { id: 'card-row-add', name: 'CardRow + AddCircle', note: 'The option row. A cream card means "tap me".' , file: 'ios/Sources/Views/Components/CardRow.swift' },
  { id: 'card-row-chip', name: 'CardRow + Chip', note: 'The same row once the document is in.' , file: 'ios/Sources/Views/Components/CardRow.swift' },
  { id: 'chapter-tiles', name: 'ChapterTile', note: 'Open (cream, what remains) and filled (lime, white chip).' , file: 'ios/Sources/Views/Case/ChapterTile.swift' },
  { id: 'fact-rows', name: 'FactRow', note: 'Facts, benefits and tips: plain rows on the page, never in a card.' , file: 'ios/Sources/Views/Components/ResultBlock.swift' },
  { id: 'result-block', name: 'ResultBlock', note: 'Soft lime, a small-caps label, the number, one line.' , file: 'ios/Sources/Views/Components/ResultBlock.swift' },
  { id: 'timeline-compact', name: 'StepTimeline, compact', note: 'The home\'s plan after the send: lilac you-are-here, green behind.' , file: 'ios/Sources/Views/Components/StepTimeline.swift' },
  { id: 'timeline-card', name: 'StepTimeline, current step as a card', note: 'The card carries the action, as in the first home and the timeline layout.' , file: 'ios/Sources/Views/Components/StepTimeline.swift' },
  { id: 'screen-title', name: 'ScreenTitle + eyebrow', note: '34 black on the shared title line, 56pt under the status bar.' , file: 'ios/Sources/Views/Components/ScreenTitle.swift' },
  { id: 'headline', name: 'State-aware headline', note: 'The lead in ink, the ask in mid green.' , file: 'ios/Sources/Views/Case/CaseHomeView.swift' },
  { id: 'advisor-card', name: 'AdvisorBadge in a FlatCard', note: 'Anna, her credential, one message button.' , file: 'ios/Sources/Views/Components/AdvisorBadge.swift' },
  { id: 'advisor-card-question', name: 'AdvisorBadge with a question', note: 'Her question replaces the title and the button turns lime.' , file: 'ios/Sources/Views/Components/AdvisorBadge.swift' },
  { id: 'avatars-and-marks', name: 'AdvisorPortrait, InitialsAvatar, CheckCircle, AddCircle, IconCircleButton', note: 'The small marks, and the icon button in both weights.' , file: 'ios/Sources/Views/Components/AdvisorPortrait.swift' },
  { id: 'chat-bubbles', name: 'ChatBubble', note: 'Anna on cream with her portrait, Betina on pale green.' , file: 'ios/Sources/Views/Case/ChatView.swift' },
  { id: 'section-label', name: 'SectionLabel', note: 'Small caps above a run of rows.' , file: 'ios/Sources/Views/Components/ScreenTitle.swift' },
]

export function Specimens() {
  const { openSource } = useCase()
  const [notice, setNotice] = useState<string | null>(null)
  const open = (file: string, name: string) => {
    const sent = openSource(file)
    setNotice(sent ? `Opening ${file.split('/').pop()} in the editor.` : `${name} lives in ${file}. Opening it needs the agent running locally.`)
  }
  return (
    <div>
      <div className="hub-specimens">
        {SPECIMENS.map(s => (
          <figure key={s.id} className="hub-specimen">
            <button type="button" className="hub-specimen__frame" onClick={() => open(s.file, s.name)} title={`Open ${s.file}`}>
              <img src={`/specimens/${s.id}.png`} alt={s.name} loading="lazy" />
            </button>
            <figcaption>
              <strong>{s.name}</strong>
              <span>{s.note}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="hub-caption" aria-live="polite">{notice ?? 'Tap a component to open its Swift file in the editor, edit, ⌘R, and the simulator shows it. Local only.'}</p>
    </div>
  )
}
