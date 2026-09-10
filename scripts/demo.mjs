// One command for panel day: relay + web. The iOS app is step 3 (Xcode ⌘R).
import { spawn } from 'node:child_process'

const relay = spawn('node', ['server/relay.mjs'], { stdio: 'inherit' })
const vite = spawn('npx', ['vite', '--port', '5173', '--strictPort'], { stdio: 'inherit' })
const procs = [relay, vite]

console.log(`
  Demo checklist:
  1. Hub:      http://localhost:5173/
  2. Advisor:  http://localhost:5173/advisor
  3. iOS app:  open ios/TaxfixExpert.xcodeproj → ⌘R (iPhone 17 Pro simulator)
`)

let stopping = false
const stop = code => {
  if (stopping) return
  stopping = true
  for (const p of procs) p.kill()
  process.exit(code ?? 0)
}

vite.on('exit', (code, signal) => {
  if (stopping) return
  if (signal) { stop(0); return }
  console.error('Port 5173 is taken, close the other dev server or run: npx vite --port 5175')
  stop(1)
})

relay.on('exit', (code, signal) => {
  if (stopping || signal) return
  stop(code ?? 1)
})

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
