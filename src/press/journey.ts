// The journey canvas (deck slide "The journey"): two flows, one per side of the
// marketplace, laid out by hand on a shared coordinate system. Node ids match the
// screenshot files in public/screenshots so the same images the hub uses appear
// here. Positions are in canvas pixels at zoom 1.

export type JourneyTab = 'customer' | 'advisor' | 'money'

export interface JourneyNode {
  id: string
  title: string
  /** One line: what this step answers or does. */
  caption: string
  /** What the other side of the marketplace sees at this moment. */
  mirror: string
  /** The problem this step exists to fix, in the words of the drop-off list or Anna's needs. */
  solves?: string
  screenshot?: string
  /** phone = tall iOS shot, web = wide advisor shot, state = no screenshot, just a labelled state. */
  kind: 'phone' | 'web' | 'state'
  x: number
  y: number
}

export interface JourneyEdge {
  from: string
  to: string
  label?: string
  /** A branch is drawn softer than the main path. */
  branch?: boolean
  /** Two cards in one column that talk both ways: one straight line, an arrow at each end. */
  both?: boolean
}

export interface JourneyLabel { text: string; x: number; y: number }

export interface JourneyFlow {
  tab: JourneyTab
  label: string
  who: string
  nodes: JourneyNode[]
  edges: JourneyEdge[]
  labels: JourneyLabel[]
}

// Card footprints (must match press.css .press-jnode--*)
export const NODE_SIZE = {
  phone: { w: 220, h: 580 },
  web: { w: 320, h: 330 },
  state: { w: 220, h: 128 },
} as const

const P = 430 // horizontal pitch for phone nodes, room for an action label between cards
// Row pitch: the card (580) plus a 320 corridor, wide enough for five labelled lanes and
// the row label without anything sitting on anything else.
const R1 = 0, R2 = 900 // rows: runway, hand-off
const BRANCH = R2 + 900 // branch row under the hand-off
const R3 = BRANCH + 900 // loop out

const customer: JourneyFlow = {
  tab: 'customer',
  label: "Betina's journey",
  who: 'iOS app, one screen per anxiety',
  nodes: [
    { id: 'w1-welcome', kind: 'phone', x: 0 * P, y: R1, title: 'Welcome', caption: 'An expert files your German taxes, in English. Real advisors, one by name: you see who would take your case before you start.', mirror: 'Anna sees nothing yet. The case does not exist.', solves: '"Is anyone actually there?", answered before sign-up', screenshot: '/screenshots/w1-welcome.png' },
    { id: 'w2-questions', kind: 'phone', x: 1 * P, y: R1, title: 'A few questions', caption: 'Where Taxfix\'s own questions about the year run: job status, benefits. The prototype marks the step and skips it.', mirror: 'Anna sees nothing yet.', screenshot: '/screenshots/w2-questions.png' },
    { id: 'w5-result', kind: 'phone', x: 2 * P, y: R1, title: 'Yes, you need to file', caption: 'Certain, not hedged: the facts of her year, each one a reason filing is mandatory. Then who would take her case, and why her.', mirror: 'Anna sees nothing yet.', solves: '"Am I in trouble?"', screenshot: '/screenshots/w5-result.png' },
    { id: 'c2-pricing', kind: 'phone', x: 3 * P, y: R1, title: 'One price, pay on approval', caption: 'When money moves, in three steps. Start free today, card saved at send, €119.99 only when she approves.', mirror: 'A new case lands in Anna\'s queue, live.', solves: '"What am I committing to, and what does it cost?"', screenshot: '/screenshots/c2-pricing.png' },
    { id: 's1-home', kind: 'phone', x: 0 * P, y: R2, title: 'Case home', caption: 'First access, after a one-time notification sheet. A sentence that knows where she is, four chapters with what is left in each, then Anna.', mirror: 'Anna sees: waiting on client, 0 of 5 shared.', solves: '"Am I making progress?"', screenshot: '/screenshots/s1-home.png' },
    { id: 's2-checklist', kind: 'phone', x: 1 * P, y: R2, title: 'One chapter', caption: 'The chapter as a list. A chapter tap lands one step past it, on its first open document; Back shows this list.', mirror: 'Anna sees the same list, with three required items missing.', solves: '"What exactly do you need from me?"', screenshot: '/screenshots/s2-checklist.png' },
    { id: 's3-item', kind: 'phone', x: 2 * P, y: R2, title: 'One document', caption: 'What it is, what it looks like, where it comes from. Photo or file, confirmed on arrival; "Next" turns to the following document.', mirror: 'The document appears in Anna\'s case for review.', solves: '"What if I get it wrong?"', screenshot: '/screenshots/s3-item.png' },
    { id: 's3-escape', kind: 'phone', x: 2 * P, y: BRANCH, title: '"I don\'t have this"', caption: 'The dead end that used to stall a case. Now a sheet offers a way forward: how to get it, ask Anna, or "does this apply to me?"', mirror: 'Anna gets a client question she can answer in one click.', solves: '"I don\'t have this document."', screenshot: '/screenshots/s3-escape.png' },
    { id: 's9-chat', kind: 'phone', x: 3 * P, y: BRANCH, title: 'Message Anna', caption: 'Not a step: a sheet, opened from Anna\'s card on the home, from "Ask a question first" before approving, and after filing. One thread.', mirror: 'The question lands in Anna\'s inbox, answerable in one click.', screenshot: '/screenshots/s9-chat.png', solves: '"Is anyone actually there?"' },
    { id: 's4-followups', kind: 'phone', x: 0 * P, y: BRANCH, title: 'Anna asks, on the home', caption: 'The home while Anna has a question. It used to be an email nobody answered; now the headline says she asked and one tap replies.', mirror: 'Anna sent it from a template. One touch.', solves: 'Every extra call or email is unpaid work for Anna', screenshot: '/screenshots/s4-followups.png' },
    { id: 's5-momentum', kind: 'phone', x: 3 * P, y: R2, title: 'All set. Send to Anna', caption: 'Everything filled: the chapters make way for a card and one button. Filling is not sending; this tap is the hand-off.', mirror: 'Anna sees: filled, not sent yet.', solves: '"Am I making progress?"', screenshot: '/screenshots/s5-send.png' },
    { id: 'sx-sent', kind: 'phone', x: 0 * P, y: R3, title: 'Sent. Anna has it', caption: 'The hand-off is done: the plan replaces the chapters and the next step is Anna\'s. The card is saved, not charged.', mirror: 'Anna sees: ready to work, the moment Betina taps.', solves: '"Is anyone actually there?"', screenshot: '/screenshots/s5-momentum.png' },
    { id: 's6-preparing', kind: 'phone', x: 1 * P, y: R3, title: 'Anna is preparing', caption: 'A quiet state while the work happens. Nothing is asked of Betina.', mirror: 'Anna sees: preparing.', solves: 'Silence after signing up', screenshot: '/screenshots/s6-preparing.png' },
    { id: 's7-review', kind: 'phone', x: 2 * P, y: R3, title: 'Review and approve', caption: 'The numbers, who prepared it, the price again, and "Ask a question first". Informed consent, not a rubber stamp.', mirror: 'Anna sees: awaiting client approval.', solves: '"I can\'t see what the expert did"', screenshot: '/screenshots/s7-review.png' },
    { id: 's8-filed', kind: 'phone', x: 3 * P, y: R3, title: 'Filed', caption: 'What happens next, when the refund lands, who filed it.', mirror: 'Anna sees: filed.', solves: 'The not-knowing, closed', screenshot: '/screenshots/s8-filed.png' },
  ],
  edges: [
    { from: 'w1-welcome', to: 'w2-questions', label: 'taps "Do I need to file?"' },
    { from: 'w2-questions', to: 'w5-result', label: 'answers, or skips' },
    { from: 'w5-result', to: 'c2-pricing', label: 'taps "See the price"' },
    { from: 'c2-pricing', to: 's1-home', label: 'taps "Start for free"' },
    { from: 's1-home', to: 's2-checklist', label: 'taps a chapter' },
    { from: 's2-checklist', to: 's3-item', label: 'lands on its first open document' },
    { from: 's3-item', to: 's3-escape', label: 'taps "I don\'t have this", asks Anna, comes back', branch: true, both: true },
    { from: 's1-home', to: 's4-followups', label: 'Anna asks, Betina answers', branch: true, both: true },
    { from: 's3-item', to: 's5-momentum', label: 'last document in, "All in. Back to overview"' },
    { from: 's5-momentum', to: 'sx-sent', label: 'taps "Send to Anna"' },
    { from: 'sx-sent', to: 's6-preparing', label: 'Anna taps "Start preparing"' },
    { from: 's6-preparing', to: 's7-review', label: 'Anna sends the draft' },
    { from: 's7-review', to: 's8-filed', label: 'taps "Approve return", Anna files' },
  ],
  labels: [
    // Row labels sit just above their cards, under every lane in the corridor.
    { text: 'Getting in: the runway', x: 0, y: -20 },
    { text: 'The hand-off: the deep slice', x: 0, y: R2 - 20 },
    { text: 'Two detours where people used to get stuck', x: 0, y: BRANCH - 20 },
    { text: 'Always there, from Anna\'s card', x: 3 * P, y: BRANCH - 20 },
    { text: 'The loop out', x: 0, y: R3 - 20 },
  ],
}

const W = 560 // horizontal pitch for web nodes, room for an action label between cards
const advisor: JourneyFlow = {
  tab: 'advisor',
  label: "Anna's workspace",
  who: 'Web dashboard, built for two touches per case',
  nodes: [
    { id: 'a1-today', kind: 'web', x: 0 * W, y: 0, title: 'Today', caption: 'What can I work on right now? Needs-you-now, at-risk, a new case request.', mirror: 'Betina has just committed on the phone.', solves: 'Which cases can I work on right now?', screenshot: '/screenshots/a1-today.png' },
    { id: 'a3-cases', kind: 'web', x: 1 * W, y: 0, title: 'Cases', caption: 'Every case with its state and deadline. Sorted by what is due, not by name.', mirror: 'Betina\'s case shows "waiting on client".', solves: 'July: sort by what is due, not by name', screenshot: '/screenshots/a3-cases.png' },
    { id: 'a2-case', kind: 'web', x: 2 * W, y: 0, title: 'One case', caption: 'The same checklist Betina sees. Preview, verify, flag with a reason, request a document.', mirror: 'A flag or request appears on Betina\'s phone at once.', solves: 'Clients think "you had everything"', screenshot: '/screenshots/a2-case.png' },
    { id: 'a4-inbox', kind: 'web', x: 1 * W, y: 440, title: 'Inbox', caption: 'Client questions to answer and follow-ups still waiting, answerable inline.', mirror: 'Betina asked from "I don\'t have this" or "Ask Anna".', solves: 'A question should not become a phone call', screenshot: '/screenshots/a4-inbox.png' },
    { id: 'st-verify', kind: 'state', x: 3 * W, y: -60, title: 'Verify or flag', caption: 'One click each. A flag carries a reason chip: blurry, wrong year, page missing.', mirror: 'Betina sees "Checked" or a fix-it task, no call needed.', solves: 'Never certify a document she has not seen' },
    { id: 'st-followup', kind: 'state', x: 3 * W, y: 110, title: 'Send a follow-up', caption: 'From a template in her own voice. Structured, not a chat thread.', mirror: 'It lands under Follow-ups on the phone.', solves: 'Two touches per case, or it does not pay' },
    { id: 'st-prepare', kind: 'state', x: 4 * W, y: 0, title: 'Prepare', caption: 'Everything required is in and legible. She starts the return.', mirror: 'Betina sees "Anna is preparing".', solves: 'Trust the status: "ready" means everything is there' },
    { id: 'st-draft', kind: 'state', x: 5 * W, y: 0, title: 'Send the draft', caption: 'Income, tax paid, deductions, refund estimate. Betina sees the same numbers on the phone.', mirror: 'Betina reviews and approves on the phone.', solves: '"I can\'t see what the expert did"' },
    { id: 'st-file', kind: 'state', x: 6 * W, y: 0, title: 'File', caption: 'Only after approval. She carries the liability, so the order matters.', mirror: 'Betina sees "Filed" and what happens next.', solves: 'She carries the liability, so approval comes first' },
    { id: 'st-nudge', kind: 'state', x: 2 * W, y: 500, title: 'Stalled? Nudge', caption: 'A case waiting more than 14 days gets a one-click nudge from Today or the case.', mirror: 'A calm reminder, not a countdown.', solves: '"Six weeks is what silence looks like from the outside"' },
  ],
  edges: [
    { from: 'a1-today', to: 'a3-cases', label: 'opens Cases' },
    { from: 'a3-cases', to: 'a2-case', label: 'opens a case' },
    { from: 'a1-today', to: 'a4-inbox', label: 'opens Inbox', branch: true },
    { from: 'a4-inbox', to: 'a2-case', label: 'taps "Open case"', branch: true },
    { from: 'a2-case', to: 'st-verify', label: 'taps Verify or Flag issue' },
    { from: 'a2-case', to: 'st-followup', label: 'writes a follow-up', branch: true },
    { from: 'st-verify', to: 'st-prepare', label: 'Betina has sent, taps "Start preparing"' },
    { from: 'st-followup', to: 'a2-case', label: 'Betina replies on the phone', branch: true },
    { from: 'st-prepare', to: 'st-draft', label: 'fills the numbers, sends to Betina for approval' },
    { from: 'st-draft', to: 'st-file', label: 'Betina approves, taps "Mark as filed"' },
    { from: 'a2-case', to: 'st-nudge', label: '14 days silent, taps "Send a nudge"', branch: true },
  ],
  labels: [
    { text: 'Triage', x: 0, y: -44 },
    { text: 'Work the case', x: 2 * W, y: -44 },
    { text: 'Close it', x: 4 * W, y: -44 },
  ],
}

// Who commits what, when. Three lanes (Betina, the platform, Anna), one commitment per
// moment, nobody commits before the other side has shown up. This is the marketplace
// model behind "Send to Anna": a place at Start, a saved card at Send, a charge at Approve.
const M = 430 // lane pitch
const MR = 300 // moment pitch
const money: JourneyFlow = {
  tab: 'money',
  label: 'When money moves',
  who: 'Three moments, three lanes: what Betina does, what the platform does, what Anna does. Nobody commits before the other side has shown up.',
  nodes: [
    { id: 'm-start', kind: 'state', x: 0 * M, y: 0 * MR, title: '1. Start, for free', caption: 'Betina commits attention, not money. She already saw who would take her case on the result screen; starting makes it real.', mirror: 'Anna: a new case in "waiting on client". Released if nothing arrives.', solves: '"Is anyone actually there?" needs a person before money' },
    { id: 'm-match', kind: 'state', x: 1 * M, y: 0 * MR, title: 'Reserve her place', caption: 'The advisor was proposed at the result, by language, region and load. Start reserves a place in her queue, not her time.', mirror: 'Betina saw "Ready to take your case: Anna Weber" one screen earlier.', solves: 'Trust on one side, no cost on the other' },
    { id: 'm-queue', kind: 'state', x: 2 * M, y: 0 * MR, title: 'New case, no work yet', caption: 'Visible in her queue as waiting. She does nothing until it is sent.', mirror: 'Betina fills the four chapters at her own pace.' },
    { id: 'm-send', kind: 'state', x: 0 * M, y: 1 * MR, title: '2. Send to Anna', caption: 'Everything filled. She adds a card, then taps Send. Nothing is charged.', mirror: 'Anna\'s chip flips from "Filled, not sent yet" to "Ready to work".', solves: 'The hand-off is one deliberate tap, not a drip of uploads' },
    { id: 'm-hold', kind: 'state', x: 1 * M, y: 1 * MR, title: 'Save the card', caption: 'Save and check the card, charge nothing. Proves the client is real before any advisor time is spent.', mirror: 'Anna is unlocked.', solves: 'Advisor time is the scarce asset in July' },
    { id: 'm-work', kind: 'state', x: 2 * M, y: 1 * MR, title: 'Prepare the return', caption: 'Starts only now. Checks each document, asks once if needed, drafts. A few days.', mirror: 'Betina sees "Anna has it from here".' },
    { id: 'm-approve', kind: 'state', x: 0 * M, y: 2 * MR, title: '3. Approve', caption: 'She sees the numbers, who prepared it and the price again. Consent first, then payment.', mirror: 'Anna sees "approved".', solves: '"I can\'t see what the expert did"' },
    { id: 'm-charge', kind: 'state', x: 1 * M, y: 2 * MR, title: 'Charge the card', caption: 'Charge €119.99, invoice by email. Anna is paid per filed case.', mirror: 'Both sides see the same number.' },
    { id: 'm-file', kind: 'state', x: 2 * M, y: 2 * MR, title: 'File with the Finanzamt', caption: 'Only after approval. She carries the professional liability, so the order matters.', mirror: 'Betina sees "Filed" and what happens next.' },
    { id: 'm-release', kind: 'state', x: 3 * M, y: 0 * MR, title: 'If nothing is sent', caption: 'A calm nudge at 14 days. As the deadline nears, the slot is released back to the pool.', mirror: 'Anna\'s capacity is never blocked by a case that never arrives.', solves: 'Capacity is the asset, not the sign-up' },
    { id: 'm-silent', kind: 'state', x: 3 * M, y: 1 * MR, title: 'If the draft is ignored', caption: 'Reminders, then the case pauses. The platform absorbs the rare abandoned draft and watches time-to-approve.', mirror: 'Named as an assumption, with a metric.' },
  ],
  edges: [
    { from: 'm-start', to: 'm-match', label: 'creates the case' },
    { from: 'm-match', to: 'm-queue', label: 'assigns a slot' },
    { from: 'm-send', to: 'm-hold', label: 'card + documents' },
    { from: 'm-hold', to: 'm-work', label: 'unlocks her' },
    { from: 'm-approve', to: 'm-charge', label: '"yes"' },
    { from: 'm-charge', to: 'm-file', label: 'paid, file it' },
    { from: 'm-queue', to: 'm-release', label: 'nothing sent in 14 days', branch: true },
    { from: 'm-work', to: 'm-silent', label: 'no answer to the draft', branch: true },
  ],
  labels: [
    { text: 'Betina', x: 0, y: -70 },
    { text: 'Taxfix platform', x: 1 * M, y: -70 },
    { text: 'Anna', x: 2 * M, y: -70 },
    { text: 'If it stalls', x: 3 * M, y: -70 },
  ],
}

export const JOURNEYS: Record<JourneyTab, JourneyFlow> = { customer, advisor, money }
export const JOURNEY_TABS: JourneyTab[] = ['customer', 'advisor', 'money']
