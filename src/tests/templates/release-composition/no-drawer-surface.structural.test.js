import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

const NON_DRAWER_SURFACES = ['src/views/Deployments/v6', 'src/templates/release-composition']

const CANONICAL_MODULE = 'src/templates/release-composition'

const SHARED_BLOCKS = [
  'CompositionField',
  'ResourceVersionField',
  'ResourceSelectField',
  'CanaryStrategyField'
]

const BLOCK_SCAN_ROOTS = ['src/templates/release-composition']

const SOURCE_EXTENSIONS = ['.vue', '.js', '.ts']

function listFiles(absDir) {
  if (!existsSync(absDir) || !statSync(absDir).isDirectory()) return []
  const out = []
  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const abs = join(absDir, entry.name)
    if (entry.isDirectory()) {
      out.push(...listFiles(abs))
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) {
      out.push(abs)
    }
  }
  return out
}

function collectSourceFiles(relDirs) {
  return relDirs.flatMap((relDir) => listFiles(join(REPO_ROOT, relDir)))
}

const DEFINE_OPTIONS_NAME = /defineOptions\s*\(\s*\{[^}]*\bname\s*:\s*['"`]([^'"`]+)['"`]/s
const OPTIONS_NAME = /(?:^|\n)\s*name\s*:\s*['"`]([^'"`]+)['"`]/

function extractComponentNames(content) {
  const names = []
  const defineMatch = content.match(DEFINE_OPTIONS_NAME)
  if (defineMatch) names.push(defineMatch[1])
  const optionsMatch = content.match(OPTIONS_NAME)
  if (optionsMatch) names.push(optionsMatch[1])
  return names
}

const CLASS_DRAWER = /class\s*=\s*["'`][^"'`]*\bdrawer\b[^"'`]*["'`]/i
const STYLE_CLASS_DRAWER = /\.[\w-]*drawer[\w-]*\b/i

describe('release-composition — Property 2 (no drawer surface, single canonical module)', () => {
  it('non-drawer surfaces do not name a component "drawer" (defineOptions / name)', () => {
    const offenders = []
    for (const file of collectSourceFiles(NON_DRAWER_SURFACES)) {
      const content = readFileSync(file, 'utf8')
      const names = extractComponentNames(content)
      for (const name of names) {
        if (/drawer/i.test(name)) {
          offenders.push(`${relative(REPO_ROOT, file)} → name "${name}"`)
        }
      }
    }
    expect(offenders, `Component names containing "drawer":\n${offenders.join('\n')}`).toEqual([])
  })

  it('non-drawer surfaces do not use a "drawer" CSS class', () => {
    const offenders = []
    for (const file of collectSourceFiles(NON_DRAWER_SURFACES)) {
      const content = readFileSync(file, 'utf8')
      if (CLASS_DRAWER.test(content) || STYLE_CLASS_DRAWER.test(content)) {
        offenders.push(relative(REPO_ROOT, file))
      }
    }
    expect(offenders, `Files using a "drawer" CSS class:\n${offenders.join('\n')}`).toEqual([])
  })

  it('each shared composition block is defined in exactly one location', () => {
    const scanFiles = collectSourceFiles(BLOCK_SCAN_ROOTS).filter((file) => file.endsWith('.vue'))

    for (const block of SHARED_BLOCKS) {
      const definitions = scanFiles.filter((file) => file.endsWith(`/${block}.vue`))

      if (definitions.length === 0) continue

      expect(
        definitions.length,
        `Shared block "${block}" must have a single canonical definition. Found:\n${definitions
          .map((file) => relative(REPO_ROOT, file))
          .join('\n')}`
      ).toBe(1)

      const canonical = join(REPO_ROOT, CANONICAL_MODULE)
      const onlyDefinition = definitions[0]
      const isUnderCanonical = onlyDefinition.startsWith(`${canonical}/`)
      if (existsSync(canonical)) {
        expect(
          isUnderCanonical,
          `Shared block "${block}" must live under "${CANONICAL_MODULE}". Found at ${relative(
            REPO_ROOT,
            onlyDefinition
          )}`
        ).toBe(true)
      }
    }
  })
})
