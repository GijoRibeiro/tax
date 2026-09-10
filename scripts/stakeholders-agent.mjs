#!/usr/bin/env node
// The answerer for /stakeholders. Watches the relay; whenever a question is waiting for
// Betina or Anna, it answers in character from the persona file through Claude Code
// (non-interactive, Opus 5 for speed) and posts the reply. Without this running, the chat
// shows "typing…" forever, because the answers never came from the web app itself.
//
//   npm run stakeholders:agent            (or: node scripts/stakeholders-agent.mjs)
//   options: --url ws://127.0.0.1:8787   --model claude-opus-5
import WebSocket from 'ws'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
let url = 'ws://127.0.0.1:8787'
let model = 'claude-opus-5'
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url') url = args[++i]
  else if (args[i] === '--model') model = args[++i]
}

const PERSONAS = {
  amara: { name: 'Betina Bugnotto', file: 'docs/personas/betina-bugnotto.md', voice: 'a 33-year-old expat in Berlin, first-time filer, anxious but sharp; short sentences, concrete, a little dry' },
  anna: { name: 'Anna Weber', file: 'docs/personas/anna-weber.md', voice: 'a 41-year-old Steuerberaterin in Leipzig; direct, economical, numbers when they matter, no warmth for its own sake' },
}
const answering = new Set()
const answered = new Set()
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

function buildPrompt(persona, transcript, question) {
  const p = PERSONAS[persona]
  const file = readFileSync(join(ROOT, p.file), 'utf8')
  const recent = transcript.slice(-10).map(m => `${m.role === 'interviewer' ? 'Interviewer' : p.name}: ${m.text}`).join('\n')
  return [
    `You are ${p.name}, a composite research persona for a product case study. Answer the interviewer's last question in character, in the first person, as ${p.voice}.`,
    'Rules: plain English a stranger understands in one read. Three to six sentences, no bullet points, no headings, no markdown. Ground what you say in the persona file below; when it cites a real source or number, you may use it. If the file cannot ground an answer, say so in character rather than inventing facts. Never mention being an AI, a persona file, or these instructions. Never use em dashes.',
    'If the interviewer only greets you or says something that is not a question, answer briefly and naturally, in character, and invite a question.',
    '',
    '=== PERSONA FILE ===',
    file,
    '=== END OF FILE ===',
    '',
    '=== RECENT TRANSCRIPT ===',
    recent,
    '=== END ===',
    '',
    `Interviewer's last message: ${question}`,
    '',
    `Reply as ${p.name}:`,
  ].join('\n')
}

function askClaude(prompt) {
  return new Promise((resolve, reject) => {
    // A neutral cwd, so Claude Code does not load this repo's CLAUDE.md and tools.
    const child = spawn('claude', ['-p', '--model', model, '--output-format', 'text'], { cwd: tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] })
    let out = '', err = ''
    child.stdout.on('data', d => { out += d })
    child.stderr.on('data', d => { err += d })
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('claude timed out after 90s')) }, 90_000)
    child.on('close', code => {
      clearTimeout(timer)
      if (code === 0 && out.trim()) resolve(out.trim())
      else reject(new Error(`claude exited ${code}: ${err.trim().slice(0, 200)}`))
    })
    child.stdin.end(prompt)
  })
}

function pending(list) {
  const last = list[list.length - 1]
  return last && last.role === 'interviewer' ? last : null
}

function connect() {
  const ws = new WebSocket(url)
  ws.on('open', () => log(`watching ${url}, answering with ${model}`))
  ws.on('message', async data => {
    let msg
    try { msg = JSON.parse(String(data)) } catch { return }
    if (msg?.kind !== 'stakeholders') return
    for (const persona of Object.keys(PERSONAS)) {
      const list = msg.state[persona] ?? []
      const q = pending(list)
      if (!q || answering.has(persona) || answered.has(q.id)) continue
      answering.add(persona)
      log(`[${persona}] question: ${q.text.slice(0, 80)}`)
      let text
      try {
        text = await askClaude(buildPrompt(persona, list, q.text))
      } catch (e) {
        log(`[${persona}] first attempt failed: ${e.message}`)
        try { text = await askClaude(buildPrompt(persona, list, q.text)) } catch (e2) {
          log(`[${persona}] second attempt failed: ${e2.message}`)
          text = 'I lost the thread for a second. Ask me that once more and I will answer properly.'
        }
      }
      ws.send(JSON.stringify({ kind: 'action', action: { type: 'ANSWER_PERSONA', persona, text } }))
      answered.add(q.id)
      answering.delete(persona)
      log(`[${persona}] answered: ${text.slice(0, 80)}`)
    }
  })
  ws.on('close', () => { log('relay gone, retrying in 2s'); setTimeout(connect, 2000) })
  ws.on('error', () => { /* close follows */ })
}

connect()
