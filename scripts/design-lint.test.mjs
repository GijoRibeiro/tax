// @vitest-environment node
// The design catalog (docs/design/CATALOG.md) is enforced here: colours and radii come
// from tokens, never from literals. Web: src/**/*.css except tokens.css. iOS: every
// Swift view except the camera sheet, which paints a real viewfinder.
import { test, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, ext, out)
    else if (p.endsWith(ext)) out.push(p)
  }
  return out
}
const root = process.cwd()
const rel = p => relative(root, p)

test('CSS uses tokens for every colour and radius (tokens.css is the only place literals live)', () => {
  const offenders = []
  for (const file of walk(join(root, 'src'), '.css')) {
    if (file.endsWith('tokens.css')) continue
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      if (line.includes('svg+xml')) return
      if (/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(line)) offenders.push(`${rel(file)}:${i + 1} colour literal: ${line.trim()}`)
      if (/border-radius:\s*[0-9.]+(px|rem|em)/.test(line)) offenders.push(`${rel(file)}:${i + 1} radius literal: ${line.trim()}`)
    })
  }
  expect(offenders, offenders.join('\n')).toEqual([])
})

test('Swift views use tokens, never system greys, literal colours, ad-hoc radii or type sizes', () => {
  const offenders = []
  for (const file of walk(join(root, 'ios/Sources'), '.swift')) {
    if (file.endsWith('ScannerSheet.swift') || file.includes('/Generated/')) continue
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      const code = line.split('//')[0]
      if (/Color\(\.system|Color\(red:|Color\(hue:|\.foregroundStyle\(\.secondary\)|\.foregroundStyle\(\.white\)|Color\.black|Color\.white|\.fill\(\.white\)/.test(code)) offenders.push(`${rel(file)}:${i + 1} colour literal: ${line.trim()}`)
      if (/cornerRadius:\s*[0-9]/.test(code)) offenders.push(`${rel(file)}:${i + 1} radius literal: ${line.trim()}`)
      if (!file.endsWith('BrandFont.swift') && /brandFont\(\s*[0-9]|\.system\(size:\s*[0-9]/.test(code)) offenders.push(`${rel(file)}:${i + 1} type size literal (use brandFont(.role) or iconFont(token)): ${line.trim()}`)
    })
  }
  expect(offenders, offenders.join('\n')).toEqual([])
})
