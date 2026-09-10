import { TOKEN_DEFS, setToken, resetTokens } from './tokens'

test('setToken writes css variable to document root', () => {
  setToken('--color-primary', '#ff0000')
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('#ff0000')
  resetTokens()
  expect(document.documentElement.style.getPropertyValue('--color-primary')).toBe('')
})

test('token defs include core semantic tokens', () => {
  const vars = TOKEN_DEFS.map(t => t.cssVar)
  for (const v of ['--color-primary', '--color-ink', '--radius-card', '--radius-control', '--size-control', '--text-scale'])
    expect(vars).toContain(v)
})
