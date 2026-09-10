export interface TokenDef {
  cssVar: string
  label: string
  kind: 'color' | 'size' | 'scale'
  value: string
  group: 'Colour' | 'Shape' | 'Type and size'
  hint: string
  min?: number
  max?: number
}

// The levers the hub exposes. Values mirror src/styles/tokens.css; the phone reads the
// same names from the generated Tokens.swift, so a change here lands on every surface.
export const TOKEN_DEFS: TokenDef[] = [
  { cssVar: '--color-primary', label: 'Lime', kind: 'color', value: '#a9e36b', group: 'Colour', hint: 'The one primary button' },
  { cssVar: '--color-accent', label: 'Dark green', kind: 'color', value: '#154618', group: 'Colour', hint: 'Links, text buttons, the welcome line' },
  { cssVar: '--color-success', label: 'Mid green', kind: 'color', value: '#2f8f3f', group: 'Colour', hint: 'Check circles, the ask in the headline' },
  { cssVar: '--color-surface-sunken', label: 'Cream', kind: 'color', value: '#fcf8f3', group: 'Colour', hint: 'Every card that taps' },
  { cssVar: '--color-ink', label: 'Ink', kind: 'color', value: '#0c0b0a', group: 'Colour', hint: 'Headings and body' },
  { cssVar: '--radius-card', label: 'Card corners', kind: 'size', value: '24px', group: 'Shape', hint: 'Cards and chapter tiles', min: 0, max: 36 },
  { cssVar: '--radius-control', label: 'Button corners', kind: 'size', value: '18px', group: 'Shape', hint: 'Primary, secondary and icon buttons', min: 0, max: 30 },
  { cssVar: '--radius-tag', label: 'Chip corners', kind: 'size', value: '12px', group: 'Shape', hint: 'Chips, tips, small blocks', min: 0, max: 20 },
  { cssVar: '--size-control', label: 'Button height', kind: 'size', value: '56px', group: 'Type and size', hint: 'All three button shapes on the phone', min: 44, max: 68 },
  { cssVar: '--text-phone-title', label: 'Title size', kind: 'size', value: '34px', group: 'Type and size', hint: 'The screen title on the phone', min: 26, max: 44 },
  { cssVar: '--text-phone-body', label: 'Body size', kind: 'size', value: '17px', group: 'Type and size', hint: 'Body copy and buttons on the phone', min: 14, max: 20 },
  { cssVar: '--text-scale', label: 'All text', kind: 'scale', value: '1', group: 'Type and size', hint: 'Every label on the phone, as a percentage', min: 85, max: 125 },
]

export const TOKEN_GROUPS = ['Colour', 'Shape', 'Type and size'] as const

// One tap, many tokens: the governance claim as a demo.
export const TOKEN_PRESETS: { name: string; hint: string; values: Record<string, string> }[] = [
  { name: 'Rounder', hint: 'Bigger, softer, louder', values: { '--radius-card': '30px', '--radius-control': '26px', '--radius-tag': '16px', '--size-control': '62px', '--text-phone-title': '38px', '--text-scale': '1.08' } },
  { name: 'Sharper', hint: 'Compact, square, quiet', values: { '--radius-card': '10px', '--radius-control': '8px', '--radius-tag': '6px', '--size-control': '48px', '--text-phone-title': '30px', '--text-scale': '0.94' } },
  { name: 'Forest', hint: 'Dark green as the primary', values: { '--color-primary': '#154618', '--color-primary-ink': '#f4f9ee', '--color-lime-soft': '#dfe9d6', '--color-info-bg': '#e6efe0' } },
]

export function setToken(cssVar: string, value: string) {
  document.documentElement.style.setProperty(cssVar, value)
}
export function resetTokens() {
  for (const t of TOKEN_DEFS) document.documentElement.style.removeProperty(t.cssVar)
  for (const p of TOKEN_PRESETS) for (const v of Object.keys(p.values)) document.documentElement.style.removeProperty(v)
}

export function applyTokenOverrides(overrides: Record<string, string>) {
  resetTokens()
  for (const [cssVar, value] of Object.entries(overrides)) setToken(cssVar, value)
}
