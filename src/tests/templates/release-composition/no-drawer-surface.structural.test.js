import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

/**
 * Structural guard for the new-release-screen feature — Property 2.
 *
 * P2 has two halves:
 *   (a) No "drawer" terminology leaks onto the non-drawer surfaces: nothing
 *       under the full-page Review & deploy view (`src/views/Deployments/v6`)
 *       or the canonical, surface-agnostic composition module
 *       (`src/templates/release-composition`) may name a component, a
 *       `defineOptions({ name })`, or a CSS class "drawer". The legacy drawer
 *       shell stays a drawer and is intentionally out of scope.
 *   (b) Single canonical module: each shared composition block
 *       (CompositionField / ResourceVersionField / ResourceSelectField /
 *       CanaryStrategyField) is defined in exactly one location. No fork.
 *
 * The check is filesystem-based (fast, no component mounting) and guards for
 * absence: the release-composition module and ReleaseComposerView do not exist
 * until later phases, so missing paths must NOT fail the suite.
 */

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../..')

// Surfaces that must stay drawer-free.
const NON_DRAWER_SURFACES = ['src/views/Deployments/v6', 'src/templates/release-composition']

// Canonical home of the shared, surface-agnostic composition blocks.
const CANONICAL_MODULE = 'src/templates/release-composition'

// Each shared block must resolve to a single defining file (basename match,
// .vue). These are the blocks the page and the legacy drawer both reuse.
const SHARED_BLOCKS = [
  'CompositionField',
  'ResourceVersionField',
  'ResourceSelectField',
  'CanaryStrategyField'
]

// Where a duplicate definition of a shared block could plausibly live. We scan
// the whole composition surface plus the legacy drawer it was relocated from;
// any second copy outside the canonical module is a fork.
const BLOCK_SCAN_ROOTS = ['src/templates/release-composition', 'src/templates/deploy-drawer-block']

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

// `defineOptions({ name: 'x-drawer-y' })` or Options API `name: 'x-drawer-y'`.
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

// CSS classes that literally contain "drawer" (e.g. class="deploy-drawer" or a
// scoped style selector .deploy-drawer). We only flag the substring "drawer",
// not the whole markup, to keep the check narrow and fast.
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

      // Absence guard: blocks have not been relocated to the canonical module
      // yet (Task 3.1). With zero definitions there is nothing to fork, so the
      // single-location invariant holds vacuously.
      if (definitions.length === 0) continue

      expect(
        definitions.length,
        `Shared block "${block}" must have a single canonical definition. Found:\n${definitions
          .map((file) => relative(REPO_ROOT, file))
          .join('\n')}`
      ).toBe(1)

      // When the block exists, its single definition must live in the canonical
      // module — never forked into a surface-specific location.
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
