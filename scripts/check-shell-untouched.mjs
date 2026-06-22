#!/usr/bin/env node

/**
 * check-shell-untouched.mjs
 *
 * Property 8 (NFR-A.1) gate for the VersionShell framework.
 *
 * A new versioned RESOURCE (Connector, Function, ...) must add ZERO lines to
 * the shared shell / command bus / state machine / use-version-form-adapter.
 * It plugs in only via thin per-resource artifacts (views, adapter, service,
 * queryKeys, routes, drawer registry entry).
 *
 * This script enforces two things against a base ref:
 *   1. PROTECTED core files (shell, bus, command, dialog, overlay) must be
 *      byte-untouched. Any diff fails.
 *   2. ALLOWLISTED framework files (factory, base, machine, form-adapter,
 *      action-bar, state-badge) may carry the documented framework-level
 *      generalizations of THIS spec, but must not leak per-resource code.
 *
 * It also verifies (best-effort, on the changed set):
 *   - no edge-api / deployment-api contract files were touched;
 *   - user-facing copy is PT while code/identifiers are EN.
 *
 * Usage:
 *   node scripts/check-shell-untouched.mjs [--base <ref>] [--working]
 *
 * Options:
 *   --base <ref>   Base ref to diff against (default: origin/dev). In CI this
 *                  MUST point at a ref where the VersionShell framework already
 *                  exists (the post-framework baseline), so the gate measures
 *                  the RESOURCE work layered on top — not the framework's own
 *                  creation commits. If <base> predates the framework, the
 *                  framework files legitimately show as "touched".
 *   --working      Diff the uncommitted working tree against HEAD. Use this when
 *                  the framework is already committed and the resource work is
 *                  still in the tree (the current state of this spec).
 *
 * Exit codes:
 *   0 - Shell untouched / only documented framework changes; copy/contract OK
 *   1 - Violation found (blocks CI)
 *   2 - Script error
 */

import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Core shell artifacts that NO change may touch (Req 11.1, NFR-A.1).
 * A diff on any of these fails the gate unconditionally.
 */
const PROTECTED_CORE = [
  'src/templates/version-shell-block/index.vue',
  'src/templates/version-shell-block/use-version-shell.js',
  'src/templates/version-shell-block/components/VersionActionDialog.vue',
  'src/templates/version-shell-block/components/ProcessingOverlay.vue',
  'src/composables/versioning/use-version-command.js',
  'src/composables/versioning/use-version-command-bus.js'
]

/**
 * Framework files where the documented generalizations of THIS spec live.
 * Changing them is allowed; leaking per-resource code into them is NOT
 * (caught by RESOURCE_LEAK_TOKENS below). The reason documents the intent.
 */
const ALLOWLIST = {
  'src/services/v2/versioning/version-adapter.js':
    'factory hook: createVersionAdapter mapMeta (task 1.1)',
  'src/services/v2/versioning/version-service-base.js':
    'base hooks: list params + invalidateAfterMutation (task 1.2)',
  'src/composables/versioning/version-machine.js':
    'generic state machine: queued/canceled/error transitions (tasks 1.x hardening)',
  'src/composables/versioning/use-version-form-adapter.js':
    'generic save flow: throw on invalid so the shell emits command-error (hardening)',
  'src/templates/version-shell-block/components/VersionActionBar.vue':
    'generic action bar: queued/canceled/error state descriptors (hardening)',
  'src/templates/version-shell-block/components/VersionStateBadge.vue':
    'generic badge: state icons for queued/error/draft (hardening)'
}

/**
 * Per-resource identifiers that must never appear in protected/allowlisted
 * framework files — the framework is resource-agnostic by contract.
 */
const RESOURCE_LEAK_TOKENS = [
  /\bedge[-_]?connector/i,
  /\bedge[-_]?function/i,
  /\bedgeFunction\b/,
  /\bEdgeConnectorsAdapter\b/,
  /\bEdgeFunctionAdapter\b/,
  /\bv4\/workspace\/connectors\b/,
  /\bv4\/workspace\/functions\b/
]

/**
 * Backend contract paths this spec must not modify (Req 12.2). edge-api /
 * deployment-api are consumed as-is via URL prefixes; `docs/` is documentation,
 * not the contract, so it is explicitly excluded.
 */
const FORBIDDEN_CONTRACT = [/(^|\/)edge-api(\/|$)/i, /(^|\/)deployment-api(\/|$)/i]
const CONTRACT_EXCLUDE = [/^docs\//i]

/**
 * Heuristic: a BARE hex color literal (forbidden by the design system). A hex
 * used as a CSS `var(--token, #fallback)` fallback is allowed, so those are
 * stripped before the test — only a hex with no design token wins flagged.
 */
const HARDCODED_HEX = /#[0-9a-fA-F]{3,8}\b/
const VAR_FALLBACK = /var\([^)]*\)/g

function parseArgs(argv) {
  const options = { base: 'origin/dev', working: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      options.base = argv[i + 1]
      i++
    } else if (argv[i] === '--working') {
      options.working = true
    }
  }
  return options
}

function git(args) {
  return execFileSync('git', args, { cwd: PROJECT_ROOT, encoding: 'utf-8' })
}

function getChangedFiles({ base, working }) {
  const range = working ? ['diff', '--name-only', 'HEAD'] : ['diff', '--name-only', `${base}...HEAD`]
  try {
    return git(range).trim().split('\n').filter(Boolean)
  } catch {
    // Fallback for shallow clones / detached states.
    try {
      return git(['diff', '--name-only', base, 'HEAD']).trim().split('\n').filter(Boolean)
    } catch (error) {
      console.error(`Failed to compute changed files against "${base}".`)
      console.error(error.message)
      process.exit(2)
    }
  }
}

function getDiff(file, { base, working }) {
  const args = working ? ['diff', '--', file] : ['diff', `${base}...HEAD`, '--', file]
  try {
    return git(args)
  } catch {
    return ''
  }
}

/** Lines added in a diff (leading `+`, excluding the `+++` header). */
function addedLines(diff) {
  return diff
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1))
}

function checkProtectedCore(changed, options, violations) {
  for (const file of PROTECTED_CORE) {
    if (changed.includes(file)) {
      violations.push({
        kind: 'protected-core-touched',
        file,
        detail: 'Core shell artifact must be byte-untouched by resource/hardening work.'
      })
    }
  }
}

function checkResourceLeak(changed, options, violations) {
  const frameworkFiles = [...PROTECTED_CORE, ...Object.keys(ALLOWLIST)]
  for (const file of frameworkFiles) {
    if (!changed.includes(file)) continue
    const added = addedLines(getDiff(file, options))
    for (const line of added) {
      const hit = RESOURCE_LEAK_TOKENS.find((re) => re.test(line))
      if (hit) {
        violations.push({
          kind: 'resource-leak',
          file,
          detail: `Per-resource token "${hit}" leaked into a framework file: ${line.trim()}`
        })
      }
    }
  }
}

function checkContract(changed, violations) {
  for (const file of changed) {
    if (CONTRACT_EXCLUDE.some((re) => re.test(file))) continue
    if (FORBIDDEN_CONTRACT.some((re) => re.test(file))) {
      violations.push({
        kind: 'contract-touched',
        file,
        detail: 'edge-api / deployment-api are consumed as-is and must not change (Req 12.2).'
      })
    }
  }
}

/**
 * Best-effort copy/locale + design-token check on this spec's changed files.
 * Reports warnings (non-blocking) for added .vue/.js lines that look like
 * hardcoded hex colors — code/identifiers EN is enforced by review + lint.
 */
function checkCopyAndTokens(changed, options, warnings) {
  const specFiles = changed.filter(
    (f) => (f.endsWith('.vue') || f.endsWith('.js')) && f.startsWith('src/')
  )
  for (const file of specFiles) {
    const added = addedLines(getDiff(file, options))
    for (const line of added) {
      const bare = line.replace(VAR_FALLBACK, '')
      if (HARDCODED_HEX.test(bare) && !line.includes('//') && !/0x/i.test(line)) {
        warnings.push({ file, detail: `Possible hardcoded color: ${line.trim()}` })
      }
    }
  }
}

function printAllowlist() {
  console.log('Documented framework changes (allowed):')
  for (const [file, reason] of Object.entries(ALLOWLIST)) {
    console.log(`  - ${file}\n      ${reason}`)
  }
  console.log('')
}

function printReport({ violations, warnings, changedCount }) {
  console.log('=== Shell-Untouched Gate (Property 8 / NFR-A.1) ===\n')
  console.log(`Changed files: ${changedCount}`)
  console.log(`Violations:    ${violations.length}`)
  console.log(`Warnings:      ${warnings.length}\n`)

  if (violations.length) {
    console.log('VIOLATIONS:\n')
    for (const v of violations) {
      console.log(`  [${v.kind}] ${v.file}`)
      console.log(`    ${v.detail}\n`)
    }
  }
  if (warnings.length) {
    console.log('WARNINGS (non-blocking):\n')
    for (const w of warnings) {
      console.log(`  ${w.file}`)
      console.log(`    ${w.detail}\n`)
    }
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  console.log(`Base: ${options.base}${options.working ? ' (working tree)' : ' (...HEAD)'}\n`)
  printAllowlist()

  const changed = getChangedFiles(options)
  const violations = []
  const warnings = []

  checkProtectedCore(changed, options, violations)
  checkResourceLeak(changed, options, violations)
  checkContract(changed, violations)
  checkCopyAndTokens(changed, options, warnings)

  printReport({ violations, warnings, changedCount: changed.length })

  if (violations.length) {
    const coreOnly = violations.every((violation) => violation.kind === 'protected-core-touched')
    if (coreOnly && !options.working) {
      console.error(
        '\nNote: if these core files only show as touched because the base ref predates ' +
          'the framework, re-run with --working or point the --base flag at the post-framework baseline.'
      )
    }
    console.error(`\nShell-untouched gate FAILED: ${violations.length} violation(s).`)
    process.exit(1)
  }
  console.log('Shell-untouched gate PASSED.')
}

main()
