#!/usr/bin/env node
// Presenter-side CLI for the stakeholder interviews. The web UI at /stakeholders
// shows the chats; the ANSWERS come from the Claude Code session running this:
//
//   node scripts/stakeholders.mjs wait [amara|anna]        block until a question is pending, print it, exit 0
//   node scripts/stakeholders.mjs reply <persona> "<text>"  answer as the persona (or --file path/to/answer.md)
//   node scripts/stakeholders.mjs ask <persona> "<text>"    put a question to the persona (appears in the UI)
//   node scripts/stakeholders.mjs show [persona]            print the transcript(s)
//   node scripts/stakeholders.mjs reset [persona]           back to the seeded interview
//
// Options: --url ws://127.0.0.1:8787 (default). Exit 2 on usage errors, 1 if the relay is unreachable.
import WebSocket from 'ws'
import { readFileSync } from 'node:fs'

const PERSONAS = ['amara', 'anna']
const args = process.argv.slice(2)
let url = 'ws://127.0.0.1:8787'
let file = null
const positional = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url') url = args[++i]
  else if (args[i] === '--file') file = args[++i]
  else positional.push(args[i])
}
const [cmd, arg1, ...rest] = positional

function usage(code = 2) {
  console.error(readFileSync(new URL(import.meta.url)).toString().split('\n').slice(1, 11).map(l => l.replace(/^\/\/ ?/, '')).join('\n'))
  process.exit(code)
}

function isPending(list) {
  const last = list[list.length - 1]
  return last && last.role === 'interviewer' ? last : null
}

function printTranscript(state, persona) {
  const name = persona === 'amara' ? 'Betina' : 'Anna'
  console.log(`\n== ${name} (${state[persona].length} messages) ==`)
  for (const m of state[persona]) {
    const who = m.role === 'interviewer' ? 'You  ' : name.padEnd(5)
    console.log(`${who} │ ${m.text}`)
  }
}

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url)
    const timer = setTimeout(() => { ws.terminate(); reject(new Error(`relay at ${url} did not answer`)) }, 4000)
    ws.on('open', () => { clearTimeout(timer); resolve(ws) })
    ws.on('error', err => { clearTimeout(timer); reject(err) })
  })
}

function frames(ws, onFrame) {
  ws.on('message', data => {
    let msg
    try { msg = JSON.parse(String(data)) } catch { return }
    if (msg?.kind === 'stakeholders') onFrame(msg.state)
  })
}

const send = (ws, action) => ws.send(JSON.stringify({ kind: 'action', action }))

async function main() {
  if (!cmd || !['wait', 'reply', 'ask', 'show', 'reset'].includes(cmd)) usage()
  const persona = arg1
  if (['reply', 'ask'].includes(cmd) && !PERSONAS.includes(persona)) usage()
  if (['wait', 'show', 'reset'].includes(cmd) && persona && !PERSONAS.includes(persona)) usage()
  let text = rest.join(' ')
  if (file) text = readFileSync(file, 'utf8').trim()
  if (['reply', 'ask'].includes(cmd) && !text.trim()) usage()

  const ws = await connect()
  const done = (code = 0) => { ws.close(); process.exit(code) }

  if (cmd === 'wait') {
    const targets = persona ? [persona] : PERSONAS
    frames(ws, state => {
      const hits = targets.map(p => [p, isPending(state[p])]).filter(([, q]) => q)
      if (!hits.length) return
      for (const [p, q] of hits) console.log(`[${p}] ${q.text}`)
      done(0)
    })
    return
  }

  if (cmd === 'show') {
    let first = true
    frames(ws, state => {
      if (!first) return
      first = false
      for (const p of persona ? [persona] : PERSONAS) printTranscript(state, p)
      done(0)
    })
    return
  }

  // reply / ask / reset: send once we've seen the first frame, exit on the echo.
  let sent = false
  frames(ws, state => {
    if (!sent) {
      sent = true
      if (cmd === 'reply') send(ws, { type: 'ANSWER_PERSONA', persona, text })
      if (cmd === 'ask') send(ws, { type: 'ASK_PERSONA', persona, text })
      if (cmd === 'reset') send(ws, persona ? { type: 'RESET_PERSONA', persona } : { type: 'RESET_STAKEHOLDERS' })
      return
    }
    if (cmd === 'reset') console.log(persona ? `${persona} reset to the seeded interview` : 'both personas reset')
    else console.log(`${cmd === 'reply' ? 'Answered as' : 'Asked'} ${persona}: ${text.slice(0, 80)}${text.length > 80 ? '…' : ''}`)
    done(0)
  })
}

main().catch(err => { console.error(`[stakeholders] ${err.message}`); process.exit(1) })
