# Design catalog, derived from the Taxfix iOS app

Source: ten screens of the real Taxfix app (2026), in `reference/`, plus taxfix.de.
This is the single description of how things look. Tokens in `src/styles/tokens.css`
are the implementation; `npm run gen:ios` carries them to `Tokens.swift`. When the two
disagree, this file wins and the tokens get fixed.

## 1. Principles seen in the app

- **Flat.** No borders on cards, no shadows worth noticing. Surfaces separate by tone:
  white page, off-white cards, tinted chips.
- **One accent family.** Lime for the primary action, dark green for text accents and
  active states, mid green for success marks. Other hues appear only as small chips
  (indigo "High impact", purple "New").
- **Big type, short lines.** Bold headings at 34pt, body at 17pt, generous line height,
  left aligned, one idea per screen.
- **Rounded, not pill.** Cards and buttons use a 20 to 24px radius. Only chips are pills.
- **Thin line icons**, single weight, dark grey, 24pt.
- **Illustrations** are 3D renders. We do not replicate them; we leave the space calm.

## 2. Colour

| Token | Value | Where the app uses it |
|---|---|---|
| `--color-ink` | `#0c0b0a` | Headings, body |
| `--color-ink-soft` | `#5b5b57` | Secondary text, icons, inactive tabs |
| `--color-surface` | `#ffffff` | Page background, selected card |
| `--color-surface-sunken` | `#fcf8f3` | Cards, option rows, list cards (Taxfix cream) |
| `--color-line` | `#e6e4df` | The only hairline: settings rows, table dividers |
| `--color-primary` | `#a9e36b` | Primary button fill ("Sign up", "Continue", "Add document") |
| `--color-primary-ink` | `#154618` | Text on the primary button |
| `--color-accent` | `#154618` | Text buttons ("Not now"), active tab label, links, tagline |
| `--color-success` | `#2f8f3f` | Check circles, selected-card border, progress |
| `--color-info-bg` | `#e1f3d8` | Green chips ("View", "Gift 25%", "New"), active tab pill |
| `--color-lime` | `#adee68` | Web-only highlights (taxfix.de CTA) |
| `--color-lime-soft` | `#d6f5a4` | The result block ("Final result €1,236.00") |
| `--color-warning` | `#c98a00` | Kept for at-risk copy |
| `--color-issue` | `#d64545` | Kept for flags and overdue |
| `--color-chip-indigo-bg` | `#e6eafb` / ink `#3b3fa8` | "High impact" chip |
| `--color-chip-purple` | `#b76cf0` / ink white | "New" chip |

## 3. Shape

| Token | Value | Notes |
|---|---|---|
| `--radius-card` | 24px | Cards, option rows, bottom-sheet corners |
| `--radius-control` | 18px | Primary and secondary buttons, inputs |
| `--font-desk` | Satoshi, then the brand sans | Anna's desk only, one face from the page title to the table. Free licence (Fontshare FFL), self-hosted in `public/fonts-satoshi/`. The phone keeps the brand sans |
| `--size-control` | 56px | Height of the primary, secondary and icon buttons on the phone. The hub's "Button height" lever |
| `--text-phone-title` | 34px | `ScreenTitle` on the phone. The hub's "Title size" lever |
| `--text-scale` | 1 | Unitless multiplier applied inside `brandFont` to every label on the phone. The hub's "All text" lever; 1 in production |
| `--text-phone-hero` … `--text-phone-micro` | 40 / 34 / 28 / 22 / 20 / 17 / 15 / 14 / 13 / 12 px | The phone's type scale: hero, title, display, heading, subheading, body, secondary, small, caption, micro. Views call `brandFont(.role, .weight)`; a number in a view fails the lint |
| `--icon-xl` / `--icon-lg` / `--icon-md` / `--icon-sm` | 30 / 24 / 22 / 18 px | SF Symbol sizes, through `iconFont(token, weight:)`. Symbols that sit in a text line use the text role's token instead |
| `--radius-pill` | 999px | Chips, tab-bar active pill, avatar |
| `--shadow-card` | none | The year cards show a whisper of shadow; we skip it |

## 4. Type (ABC ROM)

| Role | Size / weight | Use |
|---|---|---|
| Display | 34 black | Screen titles ("My account", "Choose a tax year") |
| Title | 22 bold | Section titles ("Account settings"), card headings |
| Body | 17 book | Copy, list rows |
| Caption | 14 book | Secondary lines under rows, chip text at 14 medium |
| Button | 17 bold | Primary and text buttons |

## 5. Components

- **Bottom actions** (`BottomActions`). Actions pinned at the bottom of a scrolling
  screen; content scrolls underneath and fades into a gradient blur, no hard edge.
  The bar sits 8pt above the home indicator, where the Taxfix app puts its own Continue;
  root screens that lay out their own button use the same 8pt. Never more.
- **Primary button.** Full width, 56pt tall, `--color-primary` fill, `--color-primary-ink`
  text, radius 18. Optional leading "+" glyph. One per screen, pinned to the bottom.
- **Text button.** Dark green, bold, centred, below the primary ("Not now", "No thanks").
- **Secondary button** (`SecondaryButtonLabel`). Cream, ink text, 56pt, radius 18. Wraps
  a Button, a NavigationLink or a PhotosPicker ("Choose from library").
- **Icon primary** (`PrimaryIconButton`). The primary as a 56 by 56 lime square with one
  glyph, for a row where the wide button is the secondary: the camera beside "Choose
  from library". Still one primary per screen.
- **Card.** Off-white, radius 24, 20pt padding, no border. Selected card: white with a
  1px `--color-success` border and a green check circle top-left.
- **Option row** (`CardRow` on iOS). Cream card, thin icon left (22pt light,
  `--color-ink-soft`), title 17 medium, optional grey subtitle, one trailing control:
  a chip, an `AddCircle` ("+" on the pale green disc), a radio or a chevron.
- **Section label** (`SectionLabel`). Small caps, 13 medium, soft ink, above a run of rows.
- **Settings row.** White, 24pt icon, label, chevron, hairline `--color-line` below.
- **Chip** (`Chip` on iOS, tones green / neutral / issue / indigo / onLime). Pill, 14 medium.
  Green on `--color-info-bg` with dark green text for good news; indigo for emphasis
  ("High impact"); purple for "New".
- **Check circle** (`CheckCircle` on iOS). 28pt, `--color-success` fill, white check.
- **Step timeline** (`StepTimeline`). The case as a "what now?" rail: marker per step
  (check circle done, a 20pt `--color-pastel-lilac` disc for the current step, a hollow
  circle ahead), solid green line behind what is done, dotted ahead. Past
  steps compact, the current step a cream card with its own action inside, future quiet.
  `compact: true` (the home) drops the card and renders the current step as a bold row.
  A step can carry a `route`; it then shows a chevron and opens that screen ("Documents
  sent" opens the full list). On the home the timeline appears only once every required
  document is in; before that the chapter tiles are the plan.
- **Screen title** (`ScreenTitle`). 34 black, top-left, brand face; never the system large
  title. One position on every screen: the title's top edge sits 56pt below the status
  bar, where it lands under a back-button row. Pushed screens get that from the back-button row; root screens and full-screen
  covers add `ScreenTitle.rootTopInset`; the home fills the row with its eyebrow and,
  while its body is shorter than the screen, centres the whole body instead. The
  welcome splash and the chat are the other exceptions (centred mark, Anna's header). On
  long screens use `CollapsingHeaderScroll`, which folds the title into a compact bar
  once it scrolls past the top.
- **Permission explainer.** Full screen, not a drawer, laid out like the app's own: the
  top half calm (the app puts a 3D illustration there; we leave it empty), the question
  as the title low on the page, two short paragraphs of copy, no list, the primary
  action, "Not now" as a dark green text button beneath. The one screen whose title is
  bottom-anchored rather than on the shared line.
- **Icon circle button** (`IconCircleButton`). 44pt disc on `--color-info-bg`, dark green glyph: message Anna, add a document. `prominent: true` turns it lime, for the one action that wants a tap now (Reply to Anna).
- **Initials avatar** (`InitialsAvatar`). An advisor named without a portrait: initials in
  bold dark green on the pale green disc. Fallback for the Welcome card, which features a
  different advisor per launch (placeholder portraits in `ios/Resources/advisor-*.jpg`).
- **Advisor card** (`AdvisorBadge` in a `FlatCard`). Photo, name, "Certified tax advisor", the message button. With an unanswered question from Anna, the question replaces her title and the button turns lime.
- **Chat bubble** (`ChatBubble`). Anna left on cream with her 24pt portrait, Betina right on the pale green; radius 24; composer is a cream field with a lime send disc.
- **Result block** (`ResultBlock`). Soft lime card, small-caps label, the amount at 40
  black in dark green, one line under it ("You get a tax refund!").
- **Chapter tile** (`ChapterTile`). An option tile, after the reference grid: a thin line
  icon top-left (22pt light, soft ink; dark green once filled), one chip top-right that
  says what is left in it ("3 remaining", "Sent", "✓ Checked", "Fix", "Optional"), the
  chapter's name at 17 medium along the bottom. Cream, radius 24, 18pt padding, 148pt
  tall, two columns. A filled chapter turns `--color-lime-soft` with a white chip (`Chip`
  tone `onLime`), so done reads at a glance. The four chapters are the reducer's item
  groups: About you, Your job, Unemployment benefits, Extras that raise your refund.
  Tapping one opens that chapter's list.
- **Chapter carousel** (`ChapterCarousel`, the home's default layout; the grid and the
  plain timeline stay behind the demo menu). One wide `ChapterCard` per chapter at 84 percent of the width, the next
  peeking in, paged with view alignment. The card: icon and chip on top, "Step 1 of 4",
  the name at 22 bold, its one line; cream, lime once filled, 210pt tall. A `StepRail`
  underneath: 6pt capsules, dark green and longer for the card in view, lime-soft when
  done, hairline grey ahead. When a chapter fills, the card turns lime and the row glides
  to the next open chapter after a short beat.
- **Timeline home** (`HomeLayout.timeline`, the third layout in the demo menu). The
  sentence, then the five-step `StepTimeline` from the start with the current step as a
  cream card carrying its own action (lime "Continue" to the next open chapter, later
  "Send to Anna"); Anna's card under it. No chapter tiles.
- **When money moves.** The price screen does not headline the price. Its title is "Start
  now, pay when you approve.", then a compact `StepTimeline` with three moments (today
  free, card saved at send, €119.99 at approval), two `FactRow`s, and a lime "Start for
  free". The price appears once, on the step where it is charged.
- **The send step.** Filling is not sending. Once every required document is in, the
  home becomes the hand-off screen: "All set, Betina. Everything Anna needs is here.",
  one line inviting a last look, a `ResultBlock` reading "5 of 5, Ready to send", the
  a payment-card `CardRow` (held now, charged only at approval; the lime button reads
  "Add a card to send" until it is there), the lime "Send to Anna", a "Review what you
  added" text button back to the list, and "What happens next" as three quiet `FactRow`s. The chapter tiles step aside. In the
  timeline layout the current step's cream card carries the button and the link. Only that tap (reducer action
  `SUBMIT_DOCUMENTS`) hands the case over; Anna's workspace shows "Ready to work" from
  then on, and the timeline's "Documents sent" step turns green.
- **State-aware headline.** The home has no static title. While chapters are open the
  sentence is two parts: the lead in ink ("Nice one, Betina.") and the ask in
  `--color-success`, the mid green ("Now Anna needs a few things about your income."). A small eyebrow ("Tax return
  2025", 15 medium, soft ink) and a 28 bold sentence, said the way a person would say it,
  that greets Betina and asks for the next chapter in its own words ("Hi Betina, let's get
  started. Tell us a little about you." then "Nice one, Betina. Now a bit about your job."). It changes with the phase; the layout
  under it stays.
- **Fact row** (`FactRow`). A benefit, reason or fact as a plain row: 28pt check circle
  (or a thin icon), title 17 medium, optional detail line in soft ink. No card, no
  hairline; a run of them is a list that cannot be mistaken for buttons (the pricing
  benefits, the notification reasons).
- **Link row** (`LinkRow`). The "More info" list: 24pt icon, label 17 book, chevron,
  hairline `--color-line` beneath. White, no card.
- **Back / close.** Thin "←" or "×" glyph, top-left, 24pt, ink.
- **Tab bar.** White, hairline top, three items; active item gets a pale green pill
  behind the icon and a dark green label.
- **Bottom sheet.** Radius 24 top corners, grabber, same button rules.
- **Splash.** White, wordmark centred, tagline in dark green bold, lime primary,
  text button below, language switcher top-right.

## 5b. Anna's desk (the advisor web app)

The desk is the same family as the phone in a quieter voice. Structure borrowed from an
editorial dashboard (cream header band, light title, a row of numbers, white body, white
cards), skin from Taxfix (our cream, lime, dark green, chips, ABC ROM), ideas from the
phone (a sentence that knows where Anna is, state chips that share the phone's words).
Kit in `src/advisor/kit/`, styles in `src/advisor/advisor.css`, tokens only.

- **Sidebar.** White, hairline right edge, thin 17px icons at a 1.7 stroke, 14px medium
  labels, the active row on cream in dark green, counts as pale green pills. Anna's photo,
  name and availability at the bottom.
- **Page header** (`PageHeader`). Cream band with an eyebrow, a 34px title at weight 400
  (the desk's one departure from the phone's black headings), one line of description,
  actions on the right, and a `StatRow` of numbers separated by hairlines. Scroll past it
  and a 52px condensed bar with the title sticks under the topbar.
- **Surface card** (`SurfaceCard`). White, a 1px `--color-line` hairline, radius
  `--radius-desk` (12px), 22 by 24 padding; `padded={false}` for tables and row lists;
  `tone="accent"` for a cream card (the new case request). Hairlines are allowed on the
  desk because white cards sit on a white body; the phone stays borderless.
- **Rows** (`dk-row` in `dk-rows`). Letter avatar, title, one line of text, meta on the
  right, hairlines between, cream on hover.
- **Letter avatar** (`LetterAvatar`). Initials on one of the four pastel discs, picked
  from the name so a client always gets the same colour.
- **Stat** (`Stat`). Value at 26px weight 400, label above at 12px, optional hint below;
  tones success and warning colour the value.
- **Buttons, inputs, chips.** The shared components restyled for the desk: radius
  `--radius-desk-control` (10px), 13px medium, hairline secondary, lime primary; status
  chips 11px on pale green, warm or muted grounds.
- **Motion.** Sections fade in with the deck's stagger; rows and the condensed bar use
  `--ease-out`.

## 5c. Specimens

Every iOS component above can be rendered on its own: `ComponentGalleryView` shows one
component on the muted canvas when the app is launched with `GALLERY=<name>` (and
`OFFLINE=1`). `npm run specimens` renders them all in the simulator, crops each to its
bounds, and writes `public/specimens/<name>.png`; the hub's design-system section shows
that board. Add a case to the gallery when you add a component.

## 5d. Motion

One easing everywhere, the deck's: a quick start and a long soft settle
(`Animation.brand`, `cubic-bezier(0.22, 1, 0.36, 1)`, 0.5s). Screens slide forward
(`.slideForward`), blocks within a screen rise in with a fade (`.rise`): the home's
headline and every block under it animate when the case changes state, onboarding to
home is a crossfade, a chapter tile eases to lime when it fills, the payment card row
eases in. Nothing bounces. Reduce Motion is respected by the system.

## 6. Voice on screen

English throughout. German terms appear as things to explain ("Lohnsteuerbescheinigung"
under a plain-English label), never as the label itself. Buttons say what happens next.

## 7. Rules

1. Tokens only. Every colour, radius and shadow comes from `tokens.css` (web) or the
   generated `Tokens.swift` (iOS). `scripts/design-lint.test.mjs` fails the suite on a
   literal outside `tokens.css` or outside the camera sheet.
2. Components before markup. Reuse the component list in §5 and in
   `ios/Sources/Views/Components/`. If a screen needs a variant, extend the component.
3. Adding a token or component means adding it here, in the same change, with the
   reference screen it came from.
4. Flat. Borders exist only for the selected card and hairline list dividers. No shadows.
6. A cream card means "tap me". Only content that opens, toggles or submits something
   sits on a cream card (`CardRow`, `ChapterTile`, the advisor card).
   Reasons, benefits and facts go on the plain page as `FactRow`s, never in a card;
   the pricing benefits and the notification reasons were both caught looking like
   buttons. When reviewing a screen, ask of every cream shape: what happens if I tap it?
5. Web and iOS share the same names. `--color-primary` is lime on both; do not fork.

## 8. How this maps to our surfaces

- **iOS app** follows the catalog directly: Welcome mirrors the splash (wordmark,
  headline with the dark green "In English.", Anna's card, lime button); question
  screens are option rows; checklist rows are cards; the timeline uses check circles.
- **Advisor web app** uses the same tokens, so its primary buttons are lime with dark
  green text, its cards off-white, its chips green.
- **Deck and hub** inherit the palette; the deck's pale-lime containers use
  `--color-info-bg`.
