#!/usr/bin/env node
// Back to a true first launch in one command: the case returns to the seed (relay
// RESET, which also clears "met Anna" and the notification explainer), the app is
// reinstalled from the last build so iOS forgets its notification permission and asks
// again (simctl has no privacy switch for notifications, so reinstalling is the only
// way), and the app relaunches at Welcome. Needs the relay running, the iPhone 17 Pro
// booted, and a build under ios/build (README → Run).
//
//   npm run reset:first-run
import WebSocket from 'ws'
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

const BUNDLE = 'co.cloover.TaxfixExpert'
const APP = 'ios/build/Build/Products/Debug-iphonesimulator/TaxfixExpert.app'
const url = process.env.RELAY_URL ?? 'ws://127.0.0.1:8787'

function resetRelay() {
  return new Promise(resolve => {
    const ws = new WebSocket(url)
    let sent = false
    ws.on('open', () => { ws.send(JSON.stringify({ kind: 'action', action: { type: 'RESET' } })); sent = true })
    ws.on('message', d => { const m = JSON.parse(String(d)); if (sent && m.kind === 'state') { ws.close(); resolve(true) } })
    ws.on('error', () => resolve(false))
    setTimeout(() => { ws.terminate(); resolve(false) }, 3000)
  })
}

const sh = cmd => { try { execSync(cmd, { stdio: 'ignore' }); return true } catch { return false } }

const relayOk = await resetRelay()
console.log(relayOk ? '[first-run] case reset to the seed (relay)' : '[first-run] relay not reachable, case state left as is')
sh(`xcrun simctl terminate booted ${BUNDLE}`)
if (existsSync(APP)) {
  sh(`xcrun simctl uninstall booted ${BUNDLE}`)
  const installed = sh(`xcrun simctl install booted ${APP}`)
  console.log(installed ? '[first-run] app reinstalled, iOS will ask for notification permission again' : '[first-run] reinstall failed (is the iPhone 17 booted?)')
} else {
  console.log(`[first-run] no build at ${APP}; app kept as installed (notification permission not reset). Build once per README → Run.`)
}
const launched = sh(`xcrun simctl launch booted ${BUNDLE}`)
console.log(launched ? '[first-run] app launched at Welcome' : '[first-run] app not installed on the booted simulator, build and install first')
