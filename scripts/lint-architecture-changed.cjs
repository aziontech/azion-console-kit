#!/usr/bin/env node

/**
 * lint-architecture-changed.cjs
 *
 * Diff-based architecture lint for CI.
 * Runs TanStack performance model rules as ERROR on files changed in a PR.
 * Legacy files not touched in the PR are ignored.
 *
 * Usage:
 *   node scripts/lint-architecture-changed.cjs [--base <branch>]
 *
 * Options:
 *   --base <branch>   Base branch to diff against (default: origin/dev)
 *
 * Exit codes:
 *   0 - No architecture violations in changed files
 *   1 - Architecture violations found (blocks CI)
 *   2 - Script error
 */

const { execSync } = require('child_process')
const path = require('path')
const { ESLint } = require('eslint')

const PROJECT_ROOT = path.resolve(__dirname, '..')

/** TanStack performance rules enforced as ERROR on all changed files */
const TANSTACK_RULES = {
  'azion-architecture/no-direct-http-in-components': 'error',
  'azion-architecture/no-http-in-stores': 'error',
  'azion-architecture/require-vue-query': 'error'
}

const LINT_EXTENSIONS = ['.vue', '.js', '.ts']

const GOVERNED_DIRS = [
  'src/modules/',
  'src/services/',
  'src/views/',
  'src/components/',
  'src/stores/',
  'src/composables/'
]

const RULE_PREFIX = 'azion-architecture/'

function parseArgs(argv) {
  const options = { base: 'origin/dev' }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--base' && argv[i + 1]) {
      options.base = argv[i + 1]
      i++
    }
  }
  return options
}

function getChangedFiles(base) {
  try {
    const output = execSync(`git diff --name-only --diff-filter=AM ${base}...HEAD`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    })
    return output.trim().split('\n').filter(Boolean)
  } catch {
    try {
      const output = execSync(`git diff --name-only --diff-filter=AM ${base} HEAD`, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8'
      })
      return output.trim().split('\n').filter(Boolean)
    } catch (error) {
      console.error(`Failed to get changed files against base "${base}"`)
      console.error(error.message)
      process.exit(2)
    }
  }
}

function isGovernedFile(relativePath) {
  const ext = path.extname(relativePath)
  if (!LINT_EXTENSIONS.includes(ext)) return false
  return GOVERNED_DIRS.some((dir) => relativePath.startsWith(dir))
}

async function lintFiles(filePaths) {
  if (filePaths.length === 0) return []

  const eslint = new ESLint({
    cwd: PROJECT_ROOT,
    useEslintrc: true,
    overrideConfig: {
      rules: TANSTACK_RULES
    }
  })

  const absolutePaths = filePaths.map((f) => path.resolve(PROJECT_ROOT, f))

  const filesToLint = []
  for (const filePath of absolutePaths) {
    const isIgnored = await eslint.isPathIgnored(filePath)
    if (!isIgnored) {
      filesToLint.push(filePath)
    }
  }

  if (filesToLint.length === 0) return []

  return eslint.lintFiles(filesToLint)
}

function extractViolations(results) {
  let errorCount = 0
  const violations = []

  for (const result of results) {
    const relativePath = path.relative(PROJECT_ROOT, result.filePath)
    const archErrors = result.messages.filter(
      (msg) => msg.ruleId && msg.ruleId.startsWith(RULE_PREFIX) && msg.severity === 2
    )

    for (const msg of archErrors) {
      errorCount++
      violations.push({
        file: relativePath,
        line: msg.line,
        column: msg.column,
        rule: msg.ruleId,
        message: msg.message
      })
    }
  }

  return { errorCount, violations }
}

function printReport(violations, changedCount, lintedCount) {
  console.log('=== Architecture Lint (Changed Files) ===\n')
  console.log(`Changed files:       ${changedCount}`)
  console.log(`Governed files:      ${lintedCount}`)
  console.log(`Architecture errors: ${violations.length}\n`)

  if (violations.length === 0) {
    console.log('All changed files conform to the TanStack performance model.')
    return
  }

  console.log('VIOLATIONS:\n')
  for (const v of violations) {
    console.log(`  ${v.file}:${v.line}:${v.column}`)
    console.log(`    Rule: ${v.rule}`)
    console.log(`    ${v.message}\n`)
  }

  console.log('Fix: Use composables with Vue Query (useQuery/useMutation) for server state.')
  console.log('Docs: See docs/ARCHITECTURE.md for the TanStack performance model.')
}

async function main() {
  const options = parseArgs(process.argv.slice(2))

  console.log(`Base branch: ${options.base}`)

  const changedFiles = getChangedFiles(options.base)
  const governedFiles = changedFiles.filter(isGovernedFile)

  console.log(
    `Found ${changedFiles.length} changed files, ${governedFiles.length} under architecture governance.\n`
  )

  if (governedFiles.length === 0) {
    console.log('No governed files changed. Skipping architecture lint.')
    process.exit(0)
  }

  const results = await lintFiles(governedFiles)
  const { errorCount, violations } = extractViolations(results)

  printReport(violations, changedFiles.length, governedFiles.length)

  if (errorCount > 0) {
    console.error(`\nArchitecture lint FAILED: ${errorCount} violation(s) in changed files.`)
    process.exit(1)
  }

  console.log('\nArchitecture lint PASSED.')
}

main().catch((error) => {
  console.error('Architecture lint script failed:', error.message)
  process.exit(2)
})
