// @vitest-environment node
import { test, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { JOURNEYS, JOURNEY_TABS } from '../src/press/journey.ts'

test('every screenshot the journey canvas references exists in public/', () => {
  for (const tab of JOURNEY_TABS) {
    for (const n of JOURNEYS[tab].nodes) {
      if (n.screenshot) expect(existsSync(join(process.cwd(), 'public', n.screenshot)), n.screenshot).toBe(true)
    }
  }
})
