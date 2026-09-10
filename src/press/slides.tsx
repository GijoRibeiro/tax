import type { ReactNode } from 'react'
import { PERSONAS } from '../stakeholders/personas'
import { JourneyCanvas } from './JourneyCanvas'
import { MomentsFlow } from './MomentsFlow'
import { PainAnswers } from './PainAnswers'

export interface Slide {
  id: string
  title: string
  body: ReactNode
  /** One-line presenter cue. Not rendered on the slide; shown in presenter mode (N) when `talk` is absent. */
  note?: string
  /** Presenter notes, one paragraph each. Shown in presenter mode (N), never on the slide. */
  talk?: string[]
  /** Time budget for this slide, shown in presenter mode. Mirrors docs/PANEL-RUNBOOK.md. */
  budget?: string
  /** Not in the running order yet; reachable from the overview grid. */
  parked?: boolean
  /** Only exists when the deck runs on this machine; never shipped to the deployment. */
  /** Body fills the viewport (used by the embedded interviews slide). */
  full?: boolean
  /** Comes from the gitignored slides.local.tsx: on the presenter's machine only, never deployed. */
  localOnly?: boolean
}

// Slide 1: the three drop-off moments the brief offers, with the chosen one marked.
// The reasons live in the presenter notes, not on the slide.
const MOMENTS = [
  { id: 'liability', label: 'The "do I even need to file?" moment', chosen: false },
  { id: 'commitment', label: 'The commitment moment', chosen: false },
  { id: 'hand-off', label: 'The hand-off moment', chosen: true },
]

const DROP_OFF_TO_SCREEN = [
  { q: '"What exactly do you need from me?"', screen: 'A short checklist, in plain English, with a picture of each document' },
  { q: '"Is anyone actually there?"', screen: 'A real advisor by name before she commits; her place is reserved when she starts' },
  { q: '"What if I get it wrong?"', screen: 'Each document explained, and confirmed the moment it arrives' },
  { q: '"Am I making progress?"', screen: 'One visible path from signed up to filed, and a clear "nothing left to do" moment' },
  { q: '"I don\'t have this document."', screen: 'An "I don\'t have this" option that keeps the case moving' },
]

// How I would validate before launch: one move per thing I am not sure about.
const VALIDATION_MOVES = [
  { title: 'Run it as a beta, not a lab study.', body: 'The app exists. Put the new hand-off behind a flag for a capped slice of English-UI first-time sign-ups, the current flow as control, a kill switch, and long enough to read a real difference at Taxfix\'s volumes. Start in the shoulder weeks, not the July peak.' },
  { title: 'Ask the agents first, then people.', body: 'The same approach works in real life: agents that learn from what clients and advisors do every day give a first read the same day. They order what to test next. They never replace the people below.' },
  { title: 'Watch five expats do the hand-off.', body: 'Moderated, remote, recruited from the English-UI waitlist. At every step, can they say what is left and who acts next? If not, that screen is wrong.' },
  { title: 'Ask ten people what happens to their card at "Send to Anna".', body: 'Five minutes, unmoderated. If more than one in ten says "I am paying now", the copy has failed.' },
  { title: 'Count "I don\'t have this" taps per document in the beta.', body: 'Shows which documents need a better tip, and which we should stop asking for.' },
  { title: 'Sit with three advisors and their last twenty follow-ups.', body: 'How many of the twenty could the templates have said? Under sixteen, and the advisor side is a toy.' },
  { title: 'Have a tax advisor and compliance read every explainer.', body: 'In Germany only a Steuerberater may give tax advice, so "you need to file" is a sentence someone must sign off. Friendly must never become wrong.' },
]

// If it shipped, how I would know it is working.
const SUCCESS_SIGNALS = [
  { title: 'Time to the first document.', body: 'Under a day, on median, means the chapters do their job.' },
  { title: 'Follow-up rounds per case.', body: 'Two or fewer keeps a case profitable for Anna.' },
  { title: 'Starts that reach Approve, and filed returns per advisor per week.', body: 'The money and the capacity. The hand-off is worth it only if both move.' },
  { title: 'Questions to Anna before the send.', body: 'Betina can write to her before any card is saved, so each of those messages is unpaid advisor time. Counted per case, it must stay small.' },
  { title: 'The late cohort.', body: 'The same numbers for people who arrive in the last three weeks before 31 July.' },
  { title: 'One number may not get worse: how often Anna sends a document back.', body: 'If a faster hand-off means blurrier photos and more of her time per case, the win does not count. Her accuracy is not the price of Betina\'s speed.' },
]


const SHIPPED_EDGE_CASES = [
  'Relay offline: amber "retrying" pip, auto-reconnect with backoff.',
  'Unresponsive client (>14 days, missing docs): Stalled marker + one-click nudge.',
  'Repeat problem document: second flag suggests "request a different document" instead.',
  'Deadline realities: at-risk and extension-filed cases, no countdown-panic anywhere.',
]

const DEFERRED_EDGE_CASES = [
  'GDPR retention & deletion flows',
  'Virus/malware scanning on upload',
  'Identity fraud signals',
  'Multi-advisor reassignment & vacation handover',
  'ELSTER submission failure/retry',
  'Push-notification delivery failure',
]

// Betina's walkthrough of the build as it stands (2026-09-06), answered in character
// from docs/personas/betina-bugnotto.md: screen by screen, what she thought, felt and
// where she got stuck. Nothing flagged here is fixed yet; that is the point.
const BETINA_WALK: { screen: string; thought: string; issue?: boolean }[] = [
  { screen: 'Welcome', thought: 'Everything is in English and there is one button. It asks the question I came with, "Do I need to file?", so I tapped it.' },
  { screen: 'Result', thought: 'It says yes and explains why in plain words: five months of unemployment benefit, a new job in March. It calls that routine. I relaxed. Then it shows who would take my case, from my answers. A real name before I had committed to anything.' },
  { screen: 'Price', thought: 'One flat price, €119.99, and I only pay after I have seen my return. Last year\'s service only told me the number at the end, and I left before filing. This I understood in one read.' },
  { screen: 'Notifications', thought: 'It asks for notifications before I have done anything. I said "Not now". Ask me right after I send my first document and I will say yes.', issue: true },
  { screen: 'Home', thought: 'It greets me and asks for one thing, a little about me. Four cards, the first says three to add. That looks like ten minutes, so I started on the train.' },
  { screen: 'Photo ID', thought: 'It knows what it wants and shows what the document looks like. But the camera sent the photo straight away and I never saw it. What if it was blurry?', issue: true },
  { screen: 'Income statement', thought: 'The document I once gave up on at midnight. The tip says where it comes from: the HR portal, or ask payroll. I found it in a few minutes, and the next document was one tap away.' },
  { screen: '"I don\'t have this"', thought: 'I could not find my bank letter. The sheet offered "Ask Anna". Writing to a stranger usually scares me; here it took three words.' },
  { screen: 'Send to Anna', thought: 'All five in, add a card, send. Entering a card always makes me nervous. It says the card is only saved now and charged when I approve. I read it twice and pressed send.' },
  { screen: 'Her question', thought: 'Two days later Anna asks for page 2 of my income statement, right on my home screen. I replied in the chat, but I could not attach the page there. I had to go and find the document again.', issue: true },
  { screen: 'Review', thought: '€1,184 back, with income, tax paid and deductions listed. I approved in under a minute. One thing nobody said: whether my benefit months change that number.', issue: true },
  { screen: 'Filed', thought: 'Filed. Now four to eight weeks of waiting, and the app has nothing for that stretch. A screen for the wait would be kind.', issue: true },
]

// The slide kept after the close, for when the conversation goes there.



// Slide 6, AI in my process: the personas first, then the three things the agents built.
const AI_BLOCKS: { tone: 'lime' | 'lilac' | 'orange'; icon: keyof typeof BUILT_ICONS; title: string; line: string; href?: string }[] = [
  { tone: 'lime', icon: 'phone', title: 'The native iOS app', line: 'Written in SwiftUI with the agent, screen by screen, from my decisions.' },
  { tone: 'orange', icon: 'backend', title: 'The design system', line: 'Tokens and a catalog taken from the real app, kept by a test that fails on anything off it.' },
  { tone: 'lilac', icon: 'web', title: 'The advisor web app', line: 'Anna\'s side, built in the background while I designed the phone. Web, work in progress.', href: '/advisor' },
]

// Slide 6 icons: thin line marks in pastel discs, the way taxfix.de decorates its lists.
const ICON_PROPS = { width: 22, height: 22, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const BUILT_ICONS = {
  phone: (
    <svg {...ICON_PROPS}><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
  ),
  web: (
    <svg {...ICON_PROPS}><rect x="3" y="4.5" width="18" height="13" rx="2" /><path d="M3 8.5h18M8 20.5h8" /></svg>
  ),
  backend: (
    <svg {...ICON_PROPS}><circle cx="12" cy="12" r="2.5" /><circle cx="4.5" cy="6" r="1.75" /><circle cx="19.5" cy="6" r="1.75" /><circle cx="12" cy="20" r="1.75" /><path d="M6 7.2l4 3.3M18 7.2l-4 3.3M12 14.5v3.5" /></svg>
  ),
  people: (
    <svg {...ICON_PROPS}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h7A2.5 2.5 0 0 1 16 6.5v4a2.5 2.5 0 0 1-2.5 2.5H9l-3.5 3v-3A2.5 2.5 0 0 1 4 10.5z" /><path d="M18 9.5h.5A2.5 2.5 0 0 1 21 12v3.5a2.5 2.5 0 0 1-2.5 2.5H18v3l-3.5-3H12" /></svg>
  ),
}

// Slides 2 and 3: one profile layout for both people.
function Profile({
  persona, name, facts, lede, left, right,
}: {
  persona: 'amara' | 'anna'
  name: string
  facts: string
  lede: string
  left: { title: string; items: string[] }
  right: { title: string; items: string[] }
}) {
  return (
    <div className="press-profile">
      <div className="press-profile__who">
        <img className="press-profile__portrait" src={PERSONAS[persona].portrait} alt="" width={168} height={168} />
        <h2 className="press-profile__name">{name}</h2>
        <p className="press-profile__facts">{facts}</p>
        <p className="press-profile__lede">{lede}</p>
      </div>
      <div className="press-profile__cols">
        {[left, right].map(col => (
          <div key={col.title}>
            <h3 className="press-subheading">{col.title}</h3>
            <ul className="press-bullets">
              {col.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

const ALL_SLIDES: Slide[] = [
  {
    id: 'title',
    title: 'A study of the hand-off moment',
    budget: '0:45',
    talk: [
      'Fifteen minutes, one slice, the live app throughout. Starting point, so nobody wonders: the Expert Service exists. It already connects filers with an advisor who prepares and files the return. The team\'s focus this half is growth, and first-time filers are the hardest to convert. The brief offered three drop-offs in their journey and asked me to improve one. I took the third.',
      '"Do I even need to file?" is the strongest empathy story, but the advisor is invisible in it. Mostly a content and funnel problem; weak on the marketplace criterion.',
      'The commitment moment matters for trust and price clarity, but the output is landing-page shaped. The least native-app-specific of the three.',
      'The hand-off is the only slice where both marketplace actors are live at once. Native strengths earn their place: camera capture, push-style follow-ups, glanceable status. The brief itself calls it "a common activation drop-off", the growth team\'s stated focus.',
      'The other two did not disappear. They became a thin, branch-free runway into the slice: one screen that says why an expat most likely has to file, and one pricing screen. Depth is at the hand-off.',
      'Four constraints from the brief drive everything after this: a two-sided marketplace where consumer and advisor are both real; an anxious first-time expat filer; native mobile, which the brief says three times; and one drop-off, deep rather than broad.',
    ],
    body: (
      <div className="press-moments-wrap">
        <p className="press-moments__context">
          Taxfix Expert Service already pairs filers with a tax advisor who files for them. First-time filers are the
          hardest to convert. The brief asked for one drop-off in their journey, improved.
        </p>
        <p className="press-moments__eyebrow">Three drop-offs in the brief</p>
        <ol className="press-moments">
          {MOMENTS.map(m => (
            <li
              key={m.id}
              className={m.chosen ? 'press-moment press-moment--chosen' : 'press-moment'}
              aria-current={m.chosen ? 'true' : undefined}
            >
              <span className="press-moment__mark" aria-hidden="true" />
              <span className="press-moment__label">{m.label}</span>
              {m.chosen && (
                <p className="press-moment__why">
                  The user has signed up. The return can't move until the advisor has the right documents and
                  answers. It is the moment the two-sided promise is most fragile.
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    ),
  },
  {
    id: 'user',
    title: 'Meet Betina',
    budget: '1:15',
    talk: [
      'Betina, 33, Berlin. The brief\'s target profile, given a face. An anxious, first-time expat filer navigating a foreign system in English.',
      'She lost her first German job and spent five months on Arbeitslosengeld I. That is exactly what makes her 2025 return mandatory, and she does not know that yet: her German is restaurant-level, she is afraid of calling anyone, afraid of bothering people, and a letter from the Agentur für Arbeit is sitting unread in a drawer.',
      'Three expectations she arrives with, all wrong in a way the design can fix: that it will be a lot of back-and-forth with an advisor, that it will be really expensive, and that the 31 July deadline is already a crisis. Every screen in the slice answers one of these.',
    ],
    body: (
      <Profile
        persona="amara"
        name="Betina Bugnotto"
        facts="33 · Berlin · English UI"
        lede="An anxious, first-time expat filer navigating a foreign system."
        left={{
          title: 'Where she is',
          items: [
            'Lost her first job after arriving; five months on Arbeitslosengeld I, back in work since March.',
            "Doesn't speak German beyond the basics. Official letters go in a drawer.",
            'Afraid of calling people. Afraid of bothering anyone.',
            "Doesn't even know if she needs to file.",
          ],
        }}
        right={{
          title: 'What she expects',
          items: [
            'That the timeline is already a crisis.',
            'A lot of back-and-forth with an advisor.',
            'That it will be really expensive.',
            'That nobody will actually be there once she has signed up.',
          ],
        }}
      />
    ),
  },
  {
    id: 'advisor',
    title: 'Meet the Expert',
    budget: '1:00',
    talk: [
      'Anna Weber, 41, a tax advisor in Leipzig. She runs a two-person office and takes cases from the Taxfix partner network because they are simple employee returns that keep her busy. She is the other side of the marketplace, and the brief scores whether the design works for her too.',
      'Her situation: about 60 clients at once in season, no way to hire (most German tax firms cannot right now), and a client price of about €100 per platform return, where her normal fee for the same return would be around €450. Her share is a slice of that, so a case only pays if she barely has to talk to the client. Two exchanges is the limit.',
      'What slows her down is not the tax work. It is the calls and emails around it. Good tooling lets her handle more clients by removing that back-and-forth: a queue that shows what she can work on now, requests the client can answer alone, and never asking her to confirm a document she cannot see. Every advisor-side decision in the slice comes from one of these.',
      'The marketplace point in one line: every question Betina does not need to ask is time Anna does not spend. That is what makes a real human at this price possible.',
    ],
    body: (
      <Profile
        persona="anna"
        name="Anna Weber"
        facts="41 · Leipzig · Steuerberaterin"
        lede="An independent tax advisor in the Taxfix partner network. Paid per return, and liable for each one."
        left={{
          title: 'Where she is',
          items: [
            'Runs a two-person tax office and handles about 60 clients at once in tax season.',
            "Can't hire help. Most German tax firms can't right now.",
            'Paid a flat fee per return, not by the hour. Every extra call or email is unpaid work.',
            'Personally liable for every return she files.',
          ],
        }}
        right={{
          title: 'What she needs',
          items: [
            'Cases with almost no back-and-forth. At a client price of about €100 a return, two exchanges is the limit.',
            'To see at a glance which cases she can work on now, and which are waiting on the client.',
            'Requests the client can answer on their own, without calling her.',
            'To see a document before she marks it as checked.',
          ],
        }}
      />
    ),
  },
  {
    id: 'stakeholders',
    title: 'Talking to both sides',
    budget: '1:30',
    talk: [
      'Part of the process was talking to both sides of the marketplace. I could not interview real Taxfix filers or partner advisors, so I built two composite people from what real ones say in public: Trustpilot reviews of the Expert Service, Taxfix\'s own guidance pages, the profession\'s staffing data, the fee schedule. Then I interviewed them, in character, with Claude Code.',
      'The two quotes on the slide are the two clearest examples. Betina googled "Lohnsteuerbescheinigung" at eleven at night and gave up; now every checklist item shows a picture of the document and a plain-English line on where it comes from. Anna\'s clients send what they have and assume she has everything; now both sides look at the same checklist, updated live, so nobody has to ask what is missing.',
      'Two more that changed the design: Betina\'s "if I don\'t have a document and the only option is to upload it, I\'m stuck" became the "I don\'t have this" path. Anna\'s "no way to tell, without opening each one, which of them I can actually work on" became her Today view: what needs her now, what is waiting on the client.',
      'They are still here. Press S and you can ask either of them anything; the answer is written from their persona file, sources included. Everything they cite is real; the person around it is a composite and says so.',
    ],
    body: (
      <div className="press-people">
        {(['amara', 'anna'] as const).map(id => {
          const p = PERSONAS[id]
          return (
            <figure className="press-person" key={id}>
              <img className="press-person__portrait" src={p.portrait} alt="" width={112} height={112} />
              <figcaption>
                <strong className="press-person__name">{p.name}</strong>
                <span className="press-person__situation">{p.situation}</span>
                <blockquote className="press-person__quote">"{p.quote}"</blockquote>
              </figcaption>
            </figure>
          )
        })}
        <p className="press-people__method">
          Press <kbd>S</kbd> to talk to them.
          <br />
          <span className="press-people__method-note">Composite personas from public sources, interviewed in character.</span>
        </p>
      </div>
    ),
  },
  {
    id: 'slice',
    title: 'The hand-off moment',
    budget: '2:00',
    talk: [
      'The moment I chose. Betina has decided to file, understood the price and committed. Now the return cannot move until Anna has the right documents and answers. The brief calls this "a common activation drop-off", and it is where the two-sided promise is most fragile: she thinks "I handed my taxes to a stranger, now what?", Anna thinks "I can\'t start."',
      'How do I know why people drop here? I do not have Taxfix\'s funnel data, so I built a model from three places and I say so. One: the brief itself, which describes first-time filers as anxious, unsure they need to file, skeptical, and late. Two: what real customers of expert services say in public, on Trustpilot and in forums: silence after signing up, not knowing what was needed, not seeing what the expert did, price surprises. Three: published research on document-upload and onboarding drop-off in fintech, cited on the hub.',
      'Then I pressure-tested the model with the two people you just met, in their interviews. These five questions are the result. They are hypotheses, not measurements, and the validation plan later is how I would confirm them before launch. Each one maps to a screen, so if a question is wrong, the screen it points at is the one to revisit.',
      'One acknowledgement: this list is deliberately Betina\'s. The drop-off is a consumer moment, that is what the brief asked for. But Anna is on the other end of every line here. Each unanswered question is a case she cannot start and a touch she is not paid for. The screens that answer Betina are the same ones that keep Anna at two touches, and the marketplace slide makes that explicit.',
    ],
    body: (
      <div>
        <p className="press-lede press-lede--wide">The five biggest pain points, according to the personas, and what answers each one.</p>
        <ol className="press-mapping">
          {DROP_OFF_TO_SCREEN.map(row => (
            <li key={row.q} className="press-mapping__row">
              <span className="press-mapping__q">{row.q}</span>
              <span className="press-mapping__arrow">→</span>
              <span className="press-mapping__screen">{row.screen}</span>
            </li>
          ))}
        </ol>
        <p className="press-mapping__aside">
          The drop-off is Betina's. The cost is Anna's: a case she cannot start, and every one of these five
          questions arriving as a call or an email. The same screens answer both.
        </p>
      </div>
    ),
  },
  {
    id: 'journey',
    title: 'The journey',
    budget: '2:30',
    full: true,
    talk: [
      'Two tabs, one per side. Drag to pan, pinch or ctrl-scroll to zoom, click any step for the full screen and what the other side sees at that moment. The branches are the two places people used to get stuck: "I don\'t have this" and Anna\'s follow-ups.',
      'I will walk the main path once, then switch to the simulator and do it for real: commit on the phone, watch the case land in Anna\'s queue, upload, verify, flag, follow-up, draft, approve, filed.',
    ],
    body: <JourneyCanvas />,
  },
  {
    id: 'marketplace',
    parked: true,
    budget: '1:30',
    title: 'Marketplace thinking',
    full: true,
    talk: [
      'Three lanes: Betina, the platform, Anna. One commitment per moment, and nobody commits before the other side has shown up.',
      'The advisor is proposed at the result screen and reserved at Start: Betina sees a real name before committing, Anna sees a waiting case only once Betina has started. At Send, the hand-off, Betina saves a card that is checked, not charged, so Anna never spends time on a client who cannot pay. At Approve the card is charged and Anna files.',
      'Two named assumptions at the bottom: a slot with nothing sent for 14 days is nudged and then released, and an abandoned draft is rare and absorbed by the platform, watched through time-to-approve. Every friction removed on one side shows up as margin on the other.',
    ],
    body: <JourneyCanvas initialTab="money" />,
  },
  {
    id: 'architecture',
    budget: '1:30',
    title: 'Three moments, one commitment each',
    talk: [
      'This is the proposal for who commits what, and when. Nobody commits before the other side has shown up, and each side only ever takes the risk it can see.',
      'Say who carries the risk at each moment, out loud. Before the send it is Anna, a little: a case sits in her queue that may never send, and she answers any question asked before the send. Betina has paid nothing and can still ask. That is deliberate, and it is the platform\'s job to keep it small: the place is released after two idle weeks, and questions before the send go to the FAQ and support first, Anna only after. After the send it is her hours, and the saved card covers them: nobody who cannot pay reaches her desk. If a client walks away after the draft, Taxfix pays Anna for the draft anyway; that is a named assumption, watched through time-to-approve. After approval nobody is exposed. Each side only ever takes the risk it can see.',
      'Under it sits one shared case state: Betina sends a document and Anna sees it arrive that second; Anna checks it and Betina sees the tick. That is what makes the three moments trustworthy, and what makes the live session cheap: one rule in one place, both screens follow.',
    ],
    body: <MomentsFlow />,
  },
  {
    id: 'validation',
    budget: '1:15',
    title: 'How I would validate it',
    talk: [
      'Seven moves, in this order. The first four take about a week and cost almost nothing; the beta is the proof. The frame first: this is a working app, so the honest validation is a beta with a control group, capped and with a kill switch, in the shoulder weeks rather than the July peak, because advisor capacity is the scarce thing then. Then the fast loop: the same persona agents I used here, connected to real usage, give a first read the same day and order what to test; they found five of the things on the "Betina (AI) actually used it" slide near the end, and they never replace the people. The rest each aim at one thing I am not sure about. Two of them test the moments this whole study rests on: does she always know what is left and who acts next, and does she understand that sending is not paying.',
      'One turns the "I don\'t have this" tap into data: which documents need a better tip and which we should stop asking for. One keeps the advisor side honest against real follow-ups. The last protects Taxfix: plain English reviewed by someone who knows the law.',
    ],
    body: (
      <ol className="press-bullets press-bullets--large">
        {VALIDATION_MOVES.map(row => (
          <li key={row.title}>
            <strong>{row.title}</strong> {row.body}
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: 'pain-answers',
    budget: '1:00',
    title: 'The five pains, answered',
    talk: [
      'The same five questions from the start, now with the screens that answer them. I will touch two: "what exactly do you need from me" is the chapter and the document with its tip; "I don\'t have this" is the sheet over the document and the thread it opens. The rest are here if you ask.',
    ],
    body: <PainAnswers />,
  },
  {
    id: 'success',
    budget: '1:15',
    title: 'How I would know it works',
    talk: [
      'One primary number: of the people who start, how many press "Send to Anna" within seven days. Because it runs as a beta with a control group, the first comparison is against Taxfix\'s own flow in the same weeks, not an industry band. The band, half to two thirds, is the outside reference.',
      'Around it, five signals that say why the number moved, two of them the business: starts that reach Approve, which is the charge, and filed returns per advisor per week, which is the capacity. And one number that is only allowed to hold steady: how often Anna has to send a document back. A faster hand-off must not be bought with worse documents, because Anna carries the liability and the extra work.',
    ],
    body: (
      <div className="press-two-col">
        <div>
          <h3 className="press-subheading">The one number</h3>
          <p className="press-lede">
            Of the people who start, how many press &quot;Send to Anna&quot; within seven days.
          </p>
          <p className="press-lede">
            Read in the beta against the control cohort, same weeks, same kind of sign-up. Comparable onboarding checklists in apps that verify identity finish 50 to 65 percent of the time; the target is to beat the control first, then the band.
          </p>
        </div>
        <ul className="press-bullets">
          {SUCCESS_SIGNALS.map(row => (
            <li key={row.title}>
              <strong>{row.title}</strong> {row.body}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'edge-cases',
    parked: true,
    budget: '0:45',
    title: 'Edge cases & what production needs',
    note: 'Built these, deliberately deferred those, happy to go deep.',
    body: (
      <div className="press-two-col">
        <div>
          <h3 className="press-subheading">Shipped &amp; demonstrable</h3>
          <ul className="press-bullets">
            {SHIPPED_EDGE_CASES.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="press-subheading">Deliberately deferred</h3>
          <ul className="press-bullets">
            {DEFERRED_EDGE_CASES.map(item => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'left-out',
    parked: true,
    title: 'What I deliberately did not design',
    budget: '0:45',
    talk: [
      'Focus beats breadth, said back to them. These are the cuts, named so the thinking can be followed. Payment and identity checks: approval triggers a modelled charge, not a real payment rail. Tax computation: the refund figures are seeded, not calculated. Advisor onboarding, capacity and routing: one advisor, one live case. A German-language interface: the brief\'s user is on the English UI, so German document names appear as things to explain, not as the language of the product.',
      'The other two drop-off moments from the brief did not vanish either. They became the thin runway into the slice: one screen that says why an expat most likely has to file, and one pricing screen. Depth stayed at the hand-off.',
    ],
    body: (
      <ul className="press-bullets press-bullets--large">
        <li>Payment and identity checks. Approval triggers a modelled charge, not a real payment.</li>
        <li>Real tax computation. Refund figures are seeded, not calculated.</li>
        <li>Advisor onboarding, capacity and routing. One advisor, one live case.</li>
        <li>A German-language interface. The brief's user is on the English one.</li>
      </ul>
    ),
  },
  {
    id: 'solution',
    budget: '1:30',
    title: 'AI in my process',
    talk: [
      'Before I close, how it was built. Everything you saw was built with AI, in around five to six hours of my time. More than the brief asked for, and I will say why: the agents kept building under decisions that took about the time the brief expected.',
      'The most important use is the two people. Betina and Anna started as public data, reviews, guidance pages, the fee schedule, and were trained into my personas. I interviewed them before decisions and I tested the build with them; the next slide, "Betina (AI) actually used it", is their work. They were my source and my testers.',
      'Then the three things the agents built: a native iOS app for Betina, SwiftUI on the simulator; the design system with its lint, taken from the real app; and Anna\'s web app in the background, the other side of the same case, one shared rule set so nothing drifts. Where I overrode them: a web page in a phone frame became native; uploading became a deliberate send; the first home was cut back three times.',
    ],
    body: (
      <div className="press-ai">
        <p className="press-lede press-lede--wide">Everything here was built with AI, in around five to six hours.</p>
        <div className="press-ai__personas">
          <div className="press-ai__faces">
            <img src={PERSONAS.amara.portrait} alt="" width={72} height={72} />
            <img src={PERSONAS.anna.portrait} alt="" width={72} height={72} />
          </div>
          <div>
            <strong>Two personas, built as agents</strong>
            <span>Betina and Anna collect what real filers and advisors say in public, and are trained into my personas. I interviewed them before decisions and tested every screen with them. My source, and my testers.</span>
          </div>
        </div>
        <ul className="press-built press-built--three">
          {AI_BLOCKS.map(b => (
            <li key={b.title}>
              {b.href ? (
                <a className="press-built__link" href={b.href} target="taxfix-advisor" rel="noreferrer">
                  <span className={`press-built__icon press-built__icon--${b.tone}`}>{BUILT_ICONS[b.icon]}</span>
                  <strong>{b.title} <span className="press-built__open">Open ↗</span></strong>
                  <span>{b.line}</span>
                </a>
              ) : (
                <>
                  <span className={`press-built__icon press-built__icon--${b.tone}`}>{BUILT_ICONS[b.icon]}</span>
                  <strong>{b.title}</strong>
                  <span>{b.line}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'betina-review',
    budget: '1:15',
    title: 'Betina (AI) actually used it',
    talk: [
      'One more use of AI before I close, and the honest part. I put the build in front of the Betina persona again, in character, and asked her to use it screen by screen and say what she thought, including about the money. The marked cards are things she would fix. None of them is fixed.',
      'Seven of the twelve screens she simply got through, and says so. Five she would fix, and three of those I only saw through her: she cannot attach a page when Anna asks for one in the chat, the camera never showed her the photo it sent, and nobody told her the benefit months can change the number. Those are the next things I would build, and the reason the validation plan starts with real people, not a lab.',
    ],
    body: (
      <div className="press-review">
        <div className="press-review__who">
          <img src="/personas/betina.jpg" alt="" />
          <div>
            <strong>Betina Bugnotto</strong>
            <span>Filer · 33 · Berlin. In character, on the build as it is today.</span>
          </div>
        </div>
        <h3 className="press-subheading press-walk__heading press-walk__heading--good">What worked</h3>
        <ul className="press-walk press-walk--good">
          {BETINA_WALK.filter(w => !w.issue).map(w => (
            <li key={w.screen} className="press-walk__item press-walk__item--good">
              <strong>{w.screen}</strong>
              <span>{w.thought}</span>
            </li>
          ))}
        </ul>
        <h3 className="press-subheading press-walk__heading press-walk__heading--fix">What she would fix. None of it is fixed.</h3>
        <ul className="press-walk press-walk--fix">
          {BETINA_WALK.filter(w => w.issue).map(w => (
            <li key={w.screen} className="press-walk__item press-walk__item--issue">
              <strong>{w.screen}</strong>
              <span>{w.thought}</span>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    id: 'closing',
    budget: '0:30',
    title: 'Thank you',
    talk: [
      'That is the study. Everything I showed is at one link, the same four doors: the deck, the app on GitHub, the advisor dashboard, and the specs. The next twenty minutes are yours: give me the constraint.',
    ],
    body: (
      <div className="press-close">
        <p className="press-close__lede">
          Everything is at one link: <a href="https://tax-psi-bice.vercel.app" target="_blank" rel="noreferrer">tax-psi-bice.vercel.app</a>
        </p>
        <ul className="press-close__doors">
          <li>
            <a href="https://github.com/GijoRibeiro/tax" target="_blank" rel="noreferrer">
              <strong>iOS native app</strong>
              <span>SwiftUI, in the repo under ios/. Built and demoed live.</span>
              <em>Open on GitHub →</em>
            </a>
          </li>
          <li>
            <a href="/advisor" target="taxfix-advisor" rel="noreferrer">
              <strong>Advisor dashboard</strong>
              <span>The other side of the same case. Web, work in progress.</span>
              <em>Open the dashboard →</em>
            </a>
          </li>
          <li>
            <a href="/hub" target="taxfix-hub" rel="noreferrer">
              <strong>Specs</strong>
              <span>How it was framed and built, personas to metrics.</span>
              <em>Open the specs →</em>
            </a>
          </li>
          <li>
            <a href="https://gijoribeiro.com" target="_blank" rel="noreferrer">
              <strong>@Gijo Ribeiro</strong>
              <span>Senior Product Designer.</span>
              <em>gijoribeiro.com ↗</em>
            </a>
          </li>
        </ul>
      </div>
    ),
  },
  {
    id: 'stakeholders-live',
    title: 'Ask them',
    budget: '2:00',
    parked: true,
    full: true,
    talk: [
      'Live interviews. Type a question in either column; Claude Code answers from the persona file in my terminal, and the answer lands here. Good questions from the panel: "what would make you quit in July?", "what did the last expert service get wrong?", "is the €119.99 price fair to you?"',
    ],
    body: (
      <iframe
        className="press-iframe"
        src="/stakeholders?embed=1"
        title="Stakeholder interviews"
      />
    ),
  },
]

// Local-only slides: `src/press/slides.local.tsx` is gitignored and excluded from deploys.
// When it exists and the deck runs in dev mode, its slides follow "Thank you". The glob
// resolves to nothing when the file is absent, so every other machine builds the same deck.
const localModules = import.meta.glob<{ LOCAL_SLIDES?: Slide[] }>('./slides.local.tsx', { eager: true })
const LOCAL_SLIDES: Slide[] = import.meta.env.DEV
  ? Object.values(localModules).flatMap(m => (m.LOCAL_SLIDES ?? []).map(s => ({ ...s, localOnly: true })))
  : []
const closingAt = ALL_SLIDES.findIndex(s => s.id === 'closing')
export const SLIDES: Slide[] = [...ALL_SLIDES.slice(0, closingAt + 1), ...LOCAL_SLIDES, ...ALL_SLIDES.slice(closingAt + 1)]
