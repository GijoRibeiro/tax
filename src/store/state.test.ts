import { seedState, reducer, requiredItems, sharedCount, advisorCanStart, caseStatus } from './state'

test('seed has 6 items, 5 required, nothing shared yet (a true first access)', () => {
  const s = seedState()
  expect(s.items).toHaveLength(6)
  expect(requiredItems(s)).toHaveLength(5)
  expect(sharedCount(s)).toBe(0)
  expect(advisorCanStart(s)).toBe(false)
})

test('upload moves item to uploaded and stores file name', () => {
  const s = reducer(seedState(), { type: 'UPLOAD_ITEM', itemId: 'lohnsteuer', fileName: 'scan.jpg' })
  const item = s.items.find(i => i.id === 'lohnsteuer')!
  expect(item.status).toBe('uploaded')
  expect(item.uploadedFileName).toBe('scan.jpg')
})

test('flag issue sets status + note; upload clears them', () => {
  let s = reducer(seedState(), { type: 'FLAG_ISSUE', itemId: 'id-doc', note: 'Photo is blurry' })
  expect(s.items.find(i => i.id === 'id-doc')!.status).toBe('issue')
  s = reducer(s, { type: 'UPLOAD_ITEM', itemId: 'id-doc', fileName: 'retake.jpg' })
  const item = s.items.find(i => i.id === 'id-doc')!
  expect(item.status).toBe('uploaded')
  expect(item.issueNote).toBeUndefined()
})

test('advisor can start only once everything is filled AND the client has sent it', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  expect(s.matchedAt).toBeTruthy() // an advisor is matched at Start, a slot not her time
  // Sending early is a no-op: nothing is handed over until the last required item is in.
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
  expect(s.submittedAt).toBeUndefined()
  for (const i of requiredItems(s).filter(i => i.status === 'needed'))
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: i.id, fileName: 'f.pdf' })
  expect(advisorCanStart(s)).toBe(false) // filled, not sent
  // No card, no hand-off: advisor time is never spent unbacked.
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '' })
  expect(s.submittedAt).toBeUndefined()
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
  expect(s.submittedAt).toBeTruthy()
  expect(s.cardHeldAt).toBeTruthy()
  expect(s.chargedAt).toBeUndefined() // held, not charged
  expect(advisorCanStart(s)).toBe(true)
})

test('approving captures the held card; nothing is charged before consent', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  for (const i of requiredItems(s).filter(i => i.status === 'needed'))
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: i.id, fileName: 'f.pdf' })
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
  s = reducer(s, { type: 'START_PREPARING' })
  s = reducer(s, { type: 'SEND_DRAFT', draft: { income: '1', taxPaid: '1', deductions: '1', refundEstimate: '1' } })
  expect(s.chargedAt).toBeUndefined()
  s = reducer(s, { type: 'APPROVE_RETURN' })
  expect(s.chargedAt).toBeTruthy()
})

test('follow-up lifecycle: send then answer', () => {
  let s = reducer(seedState(), { type: 'SEND_FOLLOW_UP', itemId: 'lohnsteuer', message: 'Need January payslip' })
  const fu = s.followUps.find(f => f.from === 'advisor')!
  expect(fu.status).toBe('open')
  s = reducer(s, { type: 'ANSWER_FOLLOW_UP', followUpId: fu.id, reply: 'Attached' })
  expect(s.followUps.find(f => f.id === fu.id)!.status).toBe('answered')
})

test('seed starts in onboarding and COMMIT_CASE moves to sharing', () => {
  const s = seedState()
  expect(s.phase).toBe('onboarding')
  expect(caseStatus(s)).toBe('onboarding')
  const committed = reducer(s, { type: 'COMMIT_CASE' })
  expect(committed.phase).toBe('sharing')
  expect(caseStatus(committed)).toBe('waiting_on_client')
})

test('caseStatus derives ready_to_work when all required items are in', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  for (const item of s.items.filter(i => !i.optional && i.status === 'needed')) {
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: item.id, fileName: 'x.jpg' })
  }
  expect(caseStatus(s)).toBe('waiting_on_client') // filled, but not yet sent
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
  expect(caseStatus(s)).toBe('ready_to_work')
})

test('preparing → draft → approval → filed round trip', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  s = reducer(s, { type: 'START_PREPARING' })
  expect(s.phase).toBe('preparing')
  const draft = { income: '€54,200', taxPaid: '€11,830', deductions: '€2,410', refundEstimate: '€1,286' }
  s = reducer(s, { type: 'SEND_DRAFT', draft })
  expect(s.phase).toBe('awaiting_approval')
  expect(s.draft).toEqual(draft)
  s = reducer(s, { type: 'APPROVE_RETURN' })
  expect(s.phase).toBe('approved')
  s = reducer(s, { type: 'MARK_FILED' })
  expect(s.phase).toBe('filed')
  expect(typeof s.filedAt).toBe('string')
})

test('ADD_ITEM appends a new checklist item with needed status', () => {
  const s = reducer(seedState(), {
    type: 'ADD_ITEM',
    item: {
      id: 'pendlerpauschale',
      group: 'deductions',
      title: 'Commute distance',
      explainer: 'The distance between your home and workplace.',
      lookLike: 'A note with your address and workplace address.',
      optional: true,
    },
  })
  const item = s.items.find(i => i.id === 'pendlerpauschale')
  expect(item).toBeDefined()
  expect(item!.status).toBe('needed')
  expect(s.items).toHaveLength(7)
})

test('ADD_ITEM no-ops on duplicate id', () => {
  const s = reducer(seedState(), {
    type: 'ADD_ITEM',
    item: {
      id: 'lohnsteuer',
      group: 'employment',
      title: 'Duplicate',
      explainer: 'x',
      lookLike: 'x',
      optional: false,
    },
  })
  expect(s.items).toHaveLength(6)
  expect(s.items.find(i => i.id === 'lohnsteuer')!.title).toBe('Annual income statement')
})

test('ADD_ITEM of a required item after completion flips advisorCanStart false', () => {
  let s = reducer(seedState(), { type: 'COMMIT_CASE' })
  for (const i of requiredItems(s).filter(i => i.status === 'needed'))
    s = reducer(s, { type: 'UPLOAD_ITEM', itemId: i.id, fileName: 'f.pdf' })
  s = reducer(s, { type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
  expect(advisorCanStart(s)).toBe(true)
  s = reducer(s, {
    type: 'ADD_ITEM',
    item: {
      id: 'second-payslip',
      group: 'employment',
      title: 'Second employer statement',
      explainer: 'A second Lohnsteuerbescheinigung.',
      lookLike: 'Same as the first one.',
      optional: false,
    },
  })
  expect(advisorCanStart(s)).toBe(false)
})

test('RESET returns to onboarding seed', () => {
  const s = reducer(reducer(seedState(), { type: 'COMMIT_CASE' }), { type: 'RESET' })
  expect(s.phase).toBe('onboarding')
  expect(s.draft).toBeUndefined()
})
