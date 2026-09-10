// Full simulator sweep: drives the relay through the journey and screenshots every phone
// screen into public/screenshots. Needs the relay on 8787 and the app installed on the
// booted simulator. Run from the repo root: node scripts/ios-shots.mjs
import WebSocket from 'ws'
import { execSync } from 'node:child_process'
import { mkdtempSync, copyFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BUNDLE = 'co.cloover.TaxfixExpert'
const APP = 'ios/build/Build/Products/Debug-iphonesimulator/TaxfixExpert.app'
const OUT = mkdtempSync(join(tmpdir(), 'ios-shots-')) // simctl cannot write into the repo
const sleep = ms => new Promise(r => setTimeout(r, ms))

function send(action) {
  return new Promise(resolve => {
    // First 'state' frame is the pre-action snapshot; the reduced state is the second.
    const ws = new WebSocket('ws://127.0.0.1:8787'); let frames = 0
    ws.on('open', () => ws.send(JSON.stringify({ kind: 'action', action })))
    ws.on('message', d => { const m = JSON.parse(String(d)); if (m.kind === 'state' && ++frames === 2) { ws.close(); resolve(m.state) } })
    ws.on('error', () => resolve(null)); setTimeout(() => { ws.terminate(); resolve(null) }, 3000)
  })
}
async function shot(name, env = {}, publish = true) {
  try { execSync(`xcrun simctl terminate booted ${BUNDLE}`, { stdio: 'ignore' }) } catch {}
  await sleep(500)
  const envStr = Object.entries(env).map(([k, v]) => `SIMCTL_CHILD_${k}=${v}`).join(' ')
  execSync(`env ${envStr} xcrun simctl launch booted ${BUNDLE}`, { stdio: 'ignore' })
  await sleep(3000)
  execSync(`xcrun simctl io booted screenshot ${OUT}/${name}.png`, { stdio: 'ignore' })
  if (publish) copyFileSync(`${OUT}/${name}.png`, `public/screenshots/${name}.png`)
  console.log('shot', name)
}
const draft = { income: '52,400 €', taxPaid: '9,870 €', deductions: '2,310 €', refundEstimate: '1,184 €' }

await send({ type: 'RESET' })
await shot('w1-welcome', { OFFLINE: 1, ONBOARDING_STEP: 'welcome' })
await shot('w2-questions', { OFFLINE: 1, ONBOARDING_STEP: 'questions' })
await shot('w5-result', { OFFLINE: 1, ONBOARDING_STEP: 'result' })
await shot('c2-pricing', { OFFLINE: 1, ONBOARDING_STEP: 'pricing' })
await send({ type: 'COMMIT_CASE' })
// The notification explainer shows once per install: reinstall, then launch plain.
try { execSync(`xcrun simctl uninstall booted ${BUNDLE}`, { stdio: 'ignore' }) } catch {}
execSync(`xcrun simctl install booted ${APP}`, { stdio: 'ignore' })
await shot('n1-notifications')
await shot('s1-home', { CASE_SCREEN: 'home' })
await shot('s2-checklist', { CASE_SCREEN: 'chapter:identity' })
await shot('s3-item', { CASE_SCREEN: 'item:lohnsteuer' })
await shot('s3-escape', { CASE_SCREEN: 'item-escape:lohnsteuer' })
await send({ type: 'SEND_FOLLOW_UP', itemId: 'lohnsteuer', message: 'Can you also send page 2, if there was one?' })
await shot('s4-followups', { CASE_SCREEN: 'home' })
{ const st = await send({ type: 'ASK_ADVISOR', itemId: 'general', question: 'Do I need to send the letter from the Agentur für Arbeit too?' })
  const annaQ = st?.followUps?.find(f => f.from === 'advisor' && f.status === 'open')
  if (annaQ) await send({ type: 'ANSWER_FOLLOW_UP', followUpId: annaQ.id, reply: 'Yes, sent it just now.' }) }
await shot('s9-chat', { CASE_SCREEN: 'chat' })
for (const [id, f] of [['id-doc', 'passport-photo-page.jpg'], ['tax-id', 'steuer-id-letter.jpg'], ['lohnsteuer', 'lohnsteuerbescheinigung.jpg'], ['alg-bescheid', 'alg-leistungsbescheid.jpg'], ['bank', 'bank-details.jpg']]) await send({ type: 'UPLOAD_ITEM', itemId: id, fileName: f })
await shot('s5-send', { CASE_SCREEN: 'home' })
await send({ type: 'SUBMIT_DOCUMENTS', cardLast4: '4242' })
await send({ type: 'VERIFY_ITEM', itemId: 'id-doc' })
await shot('s5-momentum', { CASE_SCREEN: 'home' })
await send({ type: 'START_PREPARING' })
await shot('s6-preparing', { CASE_SCREEN: 'home' })
await send({ type: 'SEND_DRAFT', draft })
await shot('s7-review', { CASE_SCREEN: 'home' })
await send({ type: 'APPROVE_RETURN' }); await send({ type: 'MARK_FILED' })
await shot('s8-filed', { CASE_SCREEN: 'home' })
await send({ type: 'RESET' })
console.log('done ->', OUT)
