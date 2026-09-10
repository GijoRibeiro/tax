import { test, expect } from 'vitest'
// @ts-expect-error plain-JS module without types
import { generate } from './gen-ios.mjs'

test('generate emits every css token and the seed case', () => {
  const { tokensSwift, seedJson } = generate()
  expect(tokensSwift).toContain('"--color-primary": "#a9e36b"')
  expect(tokensSwift).toContain('"--radius-card": "24px"')
  const seed = JSON.parse(seedJson)
  expect(seed.phase).toBe('onboarding')
  expect(seed.items.length).toBeGreaterThanOrEqual(6)
})
