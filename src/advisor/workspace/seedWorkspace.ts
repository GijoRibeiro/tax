import type { ChecklistItem, ItemStatus, FollowUp, ReturnDraft } from '../../types'
import { seedState } from '../../store/state'
import type {
  WorkspaceState,
  WorkspaceCase,
  ClientMeta,
  ActivityEvent,
  FollowUpTemplate,
  IncomingCaseRequest,
} from './types'

// Fixed "today" the whole seed is computed relative to, so tests are deterministic.
export const SEED_TODAY = '2026-09-01'

function daysAgo(n: number): string {
  const d = new Date(`${SEED_TODAY}T12:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString()
}

function dateOnly(iso: string): string {
  return iso.slice(0, 10)
}

type ItemOverride = Partial<Pick<ChecklistItem, 'status' | 'issueNote' | 'uploadedFileName'>>

// Clones the shared six-item checklist shape from `seedState()` and applies
// per-case status overrides. We never invent new German document types here.
// only the explainer/lookLike copy that already ships with seedState().
// The shared seed is a true first access (nothing sent). Every non-live workspace
// case starts a little further along, with the ID checked and the tax ID sent, so the
// seeded caseload has something to verify and flag.
const WORKSPACE_BASELINE: Partial<Record<string, ItemOverride>> = {
  'id-doc': { status: 'verified', uploadedFileName: 'passport-photo-page.jpg' },
  'tax-id': { status: 'uploaded', uploadedFileName: 'steuer-id-letter.jpg' },
}

function items(overrides: Partial<Record<string, ItemOverride>>, opts?: { dropDeductions?: boolean }): ChecklistItem[] {
  const base = seedState().items.map(item => ({ ...item, ...(WORKSPACE_BASELINE[item.id] ?? {}) }))
  const filtered = opts?.dropDeductions ? base.filter(item => item.id !== 'deductions') : base
  return filtered.map(item => (overrides[item.id] ? { ...item, ...overrides[item.id] } : item))
}

function allVerified(): Partial<Record<string, ItemOverride>> {
  const s: ItemStatus = 'verified'
  return {
    'id-doc': { status: s },
    'tax-id': { status: s, uploadedFileName: 'steuer-id-letter.jpg' },
    lohnsteuer: { status: s, uploadedFileName: 'lohnsteuerbescheinigung-2025.pdf' },
    'alg-bescheid': { status: s, uploadedFileName: 'alg-bescheid-2025.pdf' },
    bank: { status: s, uploadedFileName: 'iban-screenshot.png' },
  }
}

function followUp(id: string, opts: { itemId?: string; from: 'advisor' | 'consumer'; message: string; createdAt: string; status?: 'open' | 'answered'; reply?: string }): FollowUp {
  return {
    id,
    itemId: opts.itemId,
    from: opts.from,
    message: opts.message,
    createdAt: opts.createdAt,
    status: opts.status ?? 'open',
    reply: opts.reply,
  }
}

function client(meta: Omit<ClientMeta, 'joined'> & { joinedDaysAgo: number }): ClientMeta {
  return {
    id: meta.id,
    name: meta.name,
    year: meta.year,
    language: meta.language,
    email: meta.email,
    city: meta.city,
    joined: dateOnly(daysAgo(meta.joinedDaysAgo)),
    notes: meta.notes,
    history: meta.history,
  }
}

function draft(income: string, taxPaid: string, deductions: string, refundEstimate: string, note?: string): ReturnDraft {
  return { income, taxPaid, deductions, refundEstimate, note }
}

export function seedWorkspace(): WorkspaceState {
  const cases: Record<string, WorkspaceCase> = {}

  // --- Waiting on client (4), phase 'sharing', a required item still 'needed' ---

  cases['priya-nair'] = {
    client: client({
      id: 'priya-nair',
      name: 'Priya Nair',
      year: 2025,
      language: 'en',
      email: 'priya.nair@example.com',
      city: 'Berlin',
      joinedDaysAgo: 150,
      notes: 'First filing in Germany; Steuer-ID recently issued.',
      history: [],
    }),
    state: {
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
        lohnsteuer: { status: 'verified', uploadedFileName: 'lohnsteuerbescheinigung-2025.pdf' },
        'alg-bescheid': { status: 'verified', uploadedFileName: 'alg-bescheid-2025.pdf' },
      }),
      followUps: [],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(2),
    unread: true,
  }

  cases['sabine-hoffmann'] = {
    client: client({
      id: 'sabine-hoffmann',
      name: 'Sabine Hoffmann',
      year: 2025,
      language: 'de',
      email: 'sabine.hoffmann@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 300,
      notes: 'Freelance graphic designer; part-year income to account for.',
      history: ['2024 · Filed · €1,120 refunded'],
    }),
    state: {
      // Stalled: no client activity in >14 days and required docs still missing.
      phase: 'sharing',
      items: items({}),
      followUps: [],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(16),
    unread: false,
  }

  cases['lukas-schmidt'] = {
    client: client({
      id: 'lukas-schmidt',
      name: 'Lukas Schmidt',
      year: 2025,
      language: 'de',
      email: 'lukas.schmidt@example.com',
      city: 'Berlin',
      joinedDaysAgo: 90,
      notes: 'Switched employers mid-year; two income statements expected.',
      history: ['2024 · Filed · €640 refunded', '2023 · Filed · €410 refunded'],
    }),
    state: {
      phase: 'sharing',
      items: items(
        {
          'tax-id': { status: 'verified' },
          'alg-bescheid': { status: 'verified', uploadedFileName: 'alg-bescheid-2025.pdf' },
        },
        { dropDeductions: true }
      ),
      followUps: [],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(3),
    unread: true,
  }

  cases['fatima-al-sayed'] = {
    client: client({
      id: 'fatima-al-sayed',
      name: 'Fatima Al-Sayed',
      year: 2025,
      language: 'en',
      email: 'fatima.alsayed@example.com',
      city: 'Berlin',
      joinedDaysAgo: 60,
      notes: 'New arrival; still gathering paperwork from her previous employer abroad.',
      history: [],
    }),
    state: {
      phase: 'sharing',
      items: items({}, { dropDeductions: true }),
      followUps: [],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(5),
    unread: true,
  }

  // --- Blocked, asked client (3), open advisor follow-up ---

  cases['tobias-wagner'] = {
    client: client({
      id: 'tobias-wagner',
      name: 'Tobias Wagner',
      year: 2025,
      language: 'de',
      email: 'tobias.wagner@example.com',
      city: 'Berlin',
      joinedDaysAgo: 70,
      notes: 'Straightforward employee case, one open question on his income statement.',
      history: ['2024 · Filed · €780 refunded'],
    }),
    state: {
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
        'alg-bescheid': { status: 'verified', uploadedFileName: 'alg-bescheid-2025.pdf' },
      }),
      followUps: [
        followUp('fu-tobias-1', {
          itemId: 'lohnsteuer',
          from: 'advisor',
          message: 'Could you resend your Lohnsteuerbescheinigung, the copy I have is missing a page.',
          createdAt: daysAgo(4),
        }),
      ],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(4),
    unread: false,
  }

  // Twice-flagged item: two FLAG_ISSUE activity events for the same item on this case.
  cases['chen-wei'] = {
    client: client({
      id: 'chen-wei',
      name: 'Chen Wei',
      year: 2025,
      language: 'en',
      email: 'chen.wei@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 80,
      notes: 'Income statement scan has come in cropped twice, worth asking for a fresh photo.',
      history: ['2024 · Filed · €510 refunded', '2023 · Filed · €390 refunded'],
    }),
    state: {
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
        'alg-bescheid': { status: 'verified', uploadedFileName: 'alg-bescheid-2025.pdf' },
        lohnsteuer: { status: 'issue', issueNote: "The scan is cut off at the bottom, could you resend the full page?" },
      }),
      followUps: [
        followUp('fu-chen-1', {
          itemId: 'lohnsteuer',
          from: 'advisor',
          message: 'Following up again on the income statement scan, happy to share a photo tip if that helps.',
          createdAt: daysAgo(2),
        }),
      ],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(2),
    unread: true,
  }

  cases['nadia-petrova'] = {
    client: client({
      id: 'nadia-petrova',
      name: 'Nadia Petrova',
      year: 2025,
      language: 'en',
      email: 'nadia.petrova@example.com',
      city: 'Berlin',
      joinedDaysAgo: 110,
      notes: 'Bank details need a second look before the refund can be routed.',
      history: ['2024 · Filed · €1,340 refunded'],
    }),
    state: {
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
        lohnsteuer: { status: 'verified', uploadedFileName: 'lohnsteuerbescheinigung-2025.pdf' },
        'alg-bescheid': { status: 'verified', uploadedFileName: 'alg-bescheid-2025.pdf' },
        bank: { status: 'issue', issueNote: 'The IBAN format looks off, could you double-check and resend?' },
      }),
      followUps: [
        followUp('fu-nadia-1', {
          itemId: 'bank',
          from: 'advisor',
          message: 'Just flagging the IBAN issue again, no rush, whenever you get a chance.',
          createdAt: daysAgo(3),
        }),
      ],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(3),
    unread: false,
  }

  // --- Ready to work (3), all required docs in ---

  cases['jonas-brandt'] = {
    client: client({
      id: 'jonas-brandt',
      name: 'Jonas Brandt',
      year: 2025,
      language: 'de',
      email: 'jonas.brandt@example.com',
      city: 'Berlin',
      joinedDaysAgo: 40,
      notes: 'Everything is in, ready for the advisor to start preparing.',
      history: ['2024 · Filed · €890 refunded', '2023 · Filed · €705 refunded'],
    }),
    state: {
      phase: 'sharing',
      submittedAt: '2026-06-02T09:14:00.000Z', cardLast4: '4242', cardHeldAt: '2026-06-02T09:14:00.000Z',
      items: items(allVerified()),
      // Open consumer question, the client asking the advisor something, distinct
      // from the advisor-initiated follow-ups used elsewhere in this seed.
      followUps: [
        followUp('fu-jonas-1', {
          from: 'consumer',
          message: 'Can I still add a receipt I forgot about?',
          createdAt: daysAgo(1),
        }),
      ],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(1),
    unread: true,
  }

  cases['elif-yildiz'] = {
    client: client({
      id: 'elif-yildiz',
      name: 'Elif Yildiz',
      year: 2025,
      language: 'en',
      email: 'elif.yildiz@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 55,
      notes: 'Clean single-employer case.',
      history: ['2024 · Filed · €430 refunded'],
    }),
    state: {
      phase: 'sharing',
      submittedAt: '2026-06-03T17:40:00.000Z', cardLast4: '1881', cardHeldAt: '2026-06-03T17:40:00.000Z',
      items: items(allVerified(), { dropDeductions: true }),
      // Older open consumer question than Jonas's, used to assert oldest-first inbox ordering.
      followUps: [
        followUp('fu-elif-1', {
          from: 'consumer',
          message: 'When can I expect an update on my filing?',
          createdAt: daysAgo(4),
        }),
      ],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(2),
    unread: false,
  }

  cases['hannah-fischer'] = {
    client: client({
      id: 'hannah-fischer',
      name: 'Hannah Fischer',
      year: 2025,
      language: 'de',
      email: 'hannah.fischer@example.com',
      city: 'Berlin',
      joinedDaysAgo: 65,
      notes: 'Ready to work; filing under the extended deadline window.',
      history: ['2024 · Filed · €960 refunded'],
    }),
    state: { phase: 'sharing', submittedAt: '2026-06-04T08:05:00.000Z', cardLast4: '0005', cardHeldAt: '2026-06-04T08:05:00.000Z', items: items(allVerified()), followUps: [] },
    // Extended deadline (see note at bottom of file), keeps this case "active" for a 30d view.
    deadline: '2026-09-30',
    lastActivity: daysAgo(1),
    unread: true,
  }

  // --- In preparation (2), phase = preparing ---

  cases['bjorn-larsen'] = {
    client: client({
      id: 'bjorn-larsen',
      name: 'Bjorn Larsen',
      year: 2025,
      language: 'en',
      email: 'bjorn.larsen@example.com',
      city: 'Berlin',
      joinedDaysAgo: 75,
      notes: 'Advisor is working through the numbers now.',
      history: ['2024 · Filed · €1,050 refunded', '2023 · Filed · €880 refunded'],
    }),
    state: { phase: 'preparing', items: items(allVerified(), { dropDeductions: true }), followUps: [] },
    deadline: '2026-07-31',
    lastActivity: daysAgo(3),
    unread: false,
  }

  cases['aisha-diallo'] = {
    client: client({
      id: 'aisha-diallo',
      name: 'Aisha Diallo',
      year: 2025,
      language: 'en',
      email: 'aisha.diallo@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 85,
      notes: 'In preparation; filing under the extended deadline window.',
      history: ['2024 · Filed · €670 refunded'],
    }),
    state: { phase: 'preparing', items: items(allVerified()), followUps: [] },
    deadline: '2026-09-30',
    lastActivity: daysAgo(2),
    unread: false,
  }

  // --- Sent for review (2), draft awaiting client approval ---

  cases['marco-rossi'] = {
    client: client({
      id: 'marco-rossi',
      name: 'Marco Rossi',
      year: 2025,
      language: 'en',
      email: 'marco.rossi@example.com',
      city: 'Berlin',
      joinedDaysAgo: 120,
      notes: 'Draft sent, waiting on his approval.',
      history: ['2024 · Filed · €1,240 refunded', '2023 · Filed · €990 refunded', '2022 · Filed · €815 refunded'],
    }),
    state: {
      phase: 'awaiting_approval',
      items: items(allVerified()),
      followUps: [],
      draft: draft('€48,200', '€11,340', '€1,850', '€1,240', 'Refund estimate, subject to your approval.'),
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(0),
    unread: false,
  }

  cases['katarzyna-nowak'] = {
    client: client({
      id: 'katarzyna-nowak',
      name: 'Katarzyna Nowak',
      year: 2025,
      language: 'en',
      email: 'katarzyna.nowak@example.com',
      city: 'Berlin',
      joinedDaysAgo: 130,
      notes: 'Higher income year, additional tax due rather than a refund.',
      history: ['2024 · Filed · €210 additional tax paid', '2023 · Filed · €340 refunded'],
    }),
    state: {
      phase: 'awaiting_approval',
      items: items(allVerified()),
      followUps: [],
      draft: draft(
        '€76,500',
        '€9,200',
        '€600',
        '−€412 to pay',
        'Additional tax due, happy to talk through the numbers before you approve.'
      ),
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(1),
    unread: true,
  }

  // --- Approved / filed (4) ---

  cases['felix-braun'] = {
    client: client({
      id: 'felix-braun',
      name: 'Felix Braun',
      year: 2025,
      language: 'de',
      email: 'felix.braun@example.com',
      city: 'Berlin',
      joinedDaysAgo: 140,
      notes: 'Approved by the client, ready to file.',
      history: ['2024 · Filed · €2,410 refunded'],
    }),
    state: {
      phase: 'approved',
      items: items(allVerified()),
      followUps: [],
      draft: draft('€52,000', '€12,100', '€2,200', '€2,410'),
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(5),
    unread: false,
  }

  cases['ingrid-sorensen'] = {
    client: client({
      id: 'ingrid-sorensen',
      name: 'Ingrid Sorensen',
      year: 2025,
      language: 'en',
      email: 'ingrid.sorensen@example.com',
      city: 'Berlin',
      joinedDaysAgo: 200,
      notes: 'Filed in June, case closed out.',
      history: ['2024 · Filed · €3,180 refunded', '2023 · Filed · €2,860 refunded'],
    }),
    state: {
      phase: 'filed',
      items: items(allVerified()),
      followUps: [],
      draft: draft('€61,000', '€14,900', '€3,000', '€3,180'),
      filedAt: '2026-06-10T10:00:00.000Z',
    },
    deadline: '2026-07-31',
    lastActivity: '2026-06-10T10:00:00.000Z',
    unread: false,
  }

  cases['youssef-amin'] = {
    client: client({
      id: 'youssef-amin',
      name: 'Youssef Amin',
      year: 2025,
      language: 'en',
      email: 'youssef.amin@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 210,
      notes: 'Filed in June, case closed out.',
      history: ['2024 · Filed · €680 refunded'],
    }),
    state: {
      phase: 'filed',
      items: items(allVerified(), { dropDeductions: true }),
      followUps: [],
      draft: draft('€39,500', '€7,600', '€400', '€680'),
      filedAt: '2026-06-22T09:30:00.000Z',
    },
    deadline: '2026-07-31',
    lastActivity: '2026-06-22T09:30:00.000Z',
    unread: false,
  }

  cases['mateo-alvarez'] = {
    client: client({
      id: 'mateo-alvarez',
      name: 'Mateo Alvarez',
      year: 2025,
      language: 'en',
      email: 'mateo.alvarez@example.com',
      city: 'Berlin',
      joinedDaysAgo: 220,
      notes: 'Filed after the deadline, under a filed extension.',
      history: ['2024 · Filed · €910 refunded'],
    }),
    state: {
      phase: 'filed',
      items: items(allVerified()),
      followUps: [],
      draft: draft('€44,000', '€8,300', '€700', '€910'),
      filedAt: '2026-08-15T11:00:00.000Z',
    },
    // Deadline already passed by SEED_TODAY, the extension chip is what makes that calm, not alarming.
    deadline: '2026-07-31',
    lastActivity: '2026-08-15T11:00:00.000Z',
    unread: false,
    special: 'extension-filed',
  }

  // --- Edge markers (2) ---

  cases['greta-lindqvist'] = {
    client: client({
      id: 'greta-lindqvist',
      name: 'Greta Lindqvist',
      year: 2025,
      language: 'en',
      email: 'greta.lindqvist@example.com',
      city: 'Berlin',
      joinedDaysAgo: 260,
      notes: 'Paused filing after a job change abroad; reopen when she is ready.',
      history: ['2023 · Filed · €1,020 refunded'],
    }),
    state: {
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
      }),
      followUps: [],
    },
    deadline: '2026-07-31',
    lastActivity: daysAgo(45),
    unread: false,
    special: 'on-hold',
  }

  cases['oliver-weiss'] = {
    client: client({
      id: 'oliver-weiss',
      name: 'Oliver Weiss',
      year: 2025,
      language: 'de',
      email: 'oliver.weiss@example.com',
      city: 'Leipzig',
      joinedDaysAgo: 30,
      notes: 'Several required documents still missing with the deadline approaching.',
      history: ['2024 · Filed · €560 refunded'],
    }),
    state: {
      // At-risk: multiple required items still 'needed', activity recent (client is responsive but slow).
      phase: 'sharing',
      items: items({
        'tax-id': { status: 'verified' },
      }),
      followUps: [],
    },
    // See note at bottom of file: extended deadline used so this case reads as "within 30d" from SEED_TODAY.
    deadline: '2026-09-30',
    lastActivity: daysAgo(1),
    unread: true,
  }

  // --- Betina Bugnotto, the one relay-backed case; `state` here is a placeholder the provider replaces. ---

  cases['amara'] = {
    client: client({
      id: 'amara',
      name: 'Betina Bugnotto',
      year: 2025,
      language: 'en',
      email: 'betina.bugnotto@example.com',
      city: 'Berlin',
      joinedDaysAgo: 10,
      notes: 'Live case, synced with the consumer app via the relay.',
      history: [], // first filing
    }),
    state: seedState(),
    // The same 31 July her phone shows in its eyebrow; the desk says what it means for an advised return.
    deadline: '2026-07-31',
    lastActivity: SEED_TODAY,
    unread: false,
  }

  const activity: ActivityEvent[] = [
    { id: 'act-1', caseId: 'jonas-brandt', at: daysAgo(1), text: 'Verified Photo ID. Jonas Brandt' },
    { id: 'act-2', caseId: 'priya-nair', at: daysAgo(2), text: 'Verified Annual income statement. Priya Nair' },
    { id: 'act-3', caseId: 'chen-wei', at: daysAgo(6), text: 'Flagged Annual income statement. Chen Wei', itemId: 'lohnsteuer', type: 'FLAG_ISSUE' },
    { id: 'act-4', caseId: 'chen-wei', at: daysAgo(2), text: 'Flagged Annual income statement again. Chen Wei', itemId: 'lohnsteuer', type: 'FLAG_ISSUE' },
    { id: 'act-5', caseId: 'nadia-petrova', at: daysAgo(3), text: 'Flagged Bank details for your refund. Nadia Petrova', itemId: 'bank', type: 'FLAG_ISSUE' },
    { id: 'act-6', caseId: 'tobias-wagner', at: daysAgo(4), text: 'Sent a follow-up. Tobias Wagner' },
    { id: 'act-7', caseId: 'marco-rossi', at: daysAgo(0), text: 'Sent draft for approval. Marco Rossi' },
    { id: 'act-8', caseId: 'felix-braun', at: daysAgo(5), text: 'Client approved the return. Felix Braun' },
    { id: 'act-9', caseId: 'ingrid-sorensen', at: '2026-06-10T10:00:00.000Z', text: 'Filed the return. Ingrid Sorensen' },
    { id: 'act-10', caseId: 'mateo-alvarez', at: '2026-08-15T11:00:00.000Z', text: 'Filed the return under extension. Mateo Alvarez' },
    { id: 'act-11', caseId: 'oliver-weiss', at: daysAgo(1), text: 'Uploaded Photo ID. Oliver Weiss' },
  ]

  const settings: AdvisorSettingsShape = {
    acceptingNewCases: true,
    notifyClientUploads: true,
    notifyQuestions: true,
    notifyApprovals: true,
  }

  const templates: FollowUpTemplate[] = [
    {
      id: 't-gap',
      label: 'Numbers gap',
      body: 'I need your <item>, the numbers on your Lohnsteuerbescheinigung show a gap.',
    },
    {
      id: 't-incomplete',
      label: 'Incomplete pages',
      body: 'The <item> you sent is incomplete. I need all pages.',
    },
    {
      id: 't-dates',
      label: 'Confirm dates',
      body: 'Quick question about your <item>, can you confirm the dates?',
    },
  ]

  const incomingRequest: IncomingCaseRequest = {
    id: 'req-lena-fischer',
    name: 'Lena Fischer',
    city: 'Dresden',
    summary: 'First mandatory filing after freelancing, one client, simple books',
    effort: 'Straightforward, 2-3 hours',
  }

  return { cases, activity, settings, templates, incomingRequest }
}

// AdvisorSettings shape, aliased locally to keep the object literal above readable.
type AdvisorSettingsShape = WorkspaceState['settings']
