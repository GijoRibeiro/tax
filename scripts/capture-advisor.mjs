// Captures fresh advisor-workspace screenshots from a RUNNING dev server
// (start one first: `npm run demo` gives both the relay and vite; the pip
// reads green in the shots when the relay is up, but the advisor views
// themselves don't need it). Uses playwright-core against the system
// install of Google Chrome, no browser binary download required.
//
// Usage: node scripts/capture-advisor.mjs [baseUrl]
//   baseUrl defaults to http://localhost:5173

import { chromium } from 'playwright-core'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(here, '..', 'public', 'screenshots')

const BASE_URL = process.argv[2] ?? process.env.CAPTURE_BASE_URL ?? 'http://localhost:5173'

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
]

// Each target is a real advisor route (the app is a normal browser router
// here, not the hub's MemoryRouter preview) with a selector to wait on so
// the shot never fires before that view's real data has rendered.
const TARGETS = [
  { path: '/advisor', file: 'a1-today.png', waitFor: 'text=Needs you now' },
  { path: '/advisor/cases', file: 'a3-cases.png', waitFor: '[data-testid="cases-row"]' },
  { path: '/advisor/cases/amara', file: 'a2-case.png', waitFor: '.dk-case-title' },
  { path: '/advisor/inbox', file: 'a4-inbox.png', waitFor: 'text=Needs your reply' },
]

async function findChrome() {
  const { existsSync } = await import('node:fs')
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate
  }
  return undefined
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })

  const executablePath = await findChrome()
  if (!executablePath) {
    console.error('Could not find a system Chrome install. Install Google Chrome or set an executablePath.')
    process.exit(1)
  }

  const browser = await chromium.launch({ executablePath, headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  try {
    for (const target of TARGETS) {
      const url = `${BASE_URL}${target.path}`
      console.log(`→ ${url}`)
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.locator(target.waitFor).first().waitFor({ state: 'visible', timeout: 15000 })
      // Give the relay connection pip a moment to settle (green, not amber)
      // and any transition/animation to finish before the shot.
      await page.waitForTimeout(600)
      const dest = path.join(OUT_DIR, target.file)
      await page.screenshot({ path: dest })
      console.log(`  saved ${target.file}`)
    }
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
