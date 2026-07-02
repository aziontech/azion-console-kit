#!/usr/bin/env node

/**
 * Runs the security ESLint config only on files changed against a base ref.
 * Existing legacy findings outside the PR should not block unrelated changes.
 */

const { execFileSync } = require('child_process')
const path = require('path')
const { ESLint } = require('eslint')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const LINT_EXTENSIONS = new Set(['.vue', '.js', '.jsx', '.cjs', '.mjs'])
const DEFAULT_BASE_REF = 'origin/dev'
const FULL_SHA_RE = /^[0-9a-f]{40}$/i
const ZERO_SHA_RE = /^0{40}$/

function parseArgs(argv) {
  const options = { base: DEFAULT_BASE_REF }

  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--base') {
      const value = argv[index + 1]?.trim()
      if (!value || value.startsWith('--')) {
        throw new Error('--base requires a non-empty ref')
      }
      options.base = value
      index++
    }
  }

  return options
}

function git(args) {
  return execFileSync('git', args, { cwd: PROJECT_ROOT, encoding: 'utf-8' })
}

function hasRef(ref) {
  try {
    git(['cat-file', '-e', `${ref}^{commit}`])
    return true
  } catch {
    return false
  }
}

function fallbackToPreviousCommit(base) {
  if (hasRef('HEAD~1')) {
    console.warn(`Base ref "${base}" is unavailable. Falling back to "HEAD~1".`)
    return 'HEAD~1'
  }

  console.warn(`Base ref "${base}" is unavailable and HEAD has no parent. Using HEAD.`)
  return 'HEAD'
}

function resolveBaseRef(base) {
  if (ZERO_SHA_RE.test(base)) {
    return fallbackToPreviousCommit(base)
  }

  if (FULL_SHA_RE.test(base) && !hasRef(base)) {
    return fallbackToPreviousCommit(base)
  }

  fetchBaseRef(base)
  return base
}

function fetchBaseRef(base) {
  if (hasRef(base) || !base.startsWith('origin/')) return

  const branch = base.slice('origin/'.length)
  try {
    git(['fetch', 'origin', `${branch}:refs/remotes/origin/${branch}`])
  } catch {
    // Diff fallback below will report the actionable git error.
  }
}

function getChangedFiles(base) {
  const diffBase = resolveBaseRef(base)

  try {
    const output = git(['diff', '--name-only', '--diff-filter=AM', `${diffBase}...HEAD`])
    return output.trim().split('\n').filter(Boolean)
  } catch {
    try {
      const output = git(['diff', '--name-only', '--diff-filter=AM', diffBase, 'HEAD'])
      return output.trim().split('\n').filter(Boolean)
    } catch (error) {
      console.error(`Failed to get changed files against base "${diffBase}"`)
      console.error(error.message)
      process.exit(2)
    }
  }
}

function shouldLint(relativePath) {
  const normalizedPath = relativePath.replace(/\\/g, '/')
  const extension = path.extname(normalizedPath)

  if (!LINT_EXTENSIONS.has(extension)) return false
  if (normalizedPath.startsWith('cypress/')) return false
  if (normalizedPath.startsWith('node_modules/')) return false
  if (normalizedPath.includes('/node_modules/')) return false
  if (/cypress\.config\.(js|cjs|mjs)$/.test(normalizedPath)) return false
  if (/(^|\/).*\.(test|spec)\.(js|jsx|cjs|mjs)$/.test(normalizedPath)) return false

  return true
}

async function lintFiles(filePaths) {
  if (!filePaths.length) return []

  const eslint = new ESLint({
    cwd: PROJECT_ROOT,
    useEslintrc: false,
    overrideConfigFile: path.join(PROJECT_ROOT, '.eslintrc-security.cjs')
  })

  const absolutePaths = filePaths.map((filePath) => path.resolve(PROJECT_ROOT, filePath))
  const filesToLint = []

  for (const filePath of absolutePaths) {
    const isIgnored = await eslint.isPathIgnored(filePath)
    if (!isIgnored) filesToLint.push(filePath)
  }

  if (!filesToLint.length) return []

  return eslint.lintFiles(filesToLint)
}

async function main() {
  const { base } = parseArgs(process.argv.slice(2))
  const changedFiles = getChangedFiles(base)
  const filesToLint = changedFiles.filter(shouldLint)

  console.log('=== Security Lint (Changed Files) ===\n')
  console.log(`Base ref:            ${base}`)
  console.log(`Changed files:       ${changedFiles.length}`)
  console.log(`Security lint files: ${filesToLint.length}\n`)

  if (!filesToLint.length) {
    console.log('No security-governed files changed. Skipping security lint.')
    return
  }

  const results = await lintFiles(filesToLint)
  const formatter = await new ESLint().loadFormatter('stylish')
  const output = formatter.format(results)

  if (output) console.log(output)

  const errorCount = results.reduce((total, result) => total + result.errorCount, 0)
  if (errorCount > 0) {
    console.error(`Security lint FAILED: ${errorCount} error(s) in changed files.`)
    process.exit(1)
  }

  console.log('Security lint PASSED.')
}

main().catch((error) => {
  console.error('Security lint script failed:', error.message)
  process.exit(2)
})
