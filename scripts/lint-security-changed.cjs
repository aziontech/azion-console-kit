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

function parseArgs(argv) {
  const options = { base: 'origin/dev' }

  for (let index = 0; index < argv.length; index++) {
    if (argv[index] === '--base' && argv[index + 1]) {
      options.base = argv[index + 1]
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
    git(['rev-parse', '--verify', '--quiet', ref])
    return true
  } catch {
    return false
  }
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
  fetchBaseRef(base)

  try {
    const output = git(['diff', '--name-only', '--diff-filter=AM', `${base}...HEAD`])
    return output.trim().split('\n').filter(Boolean)
  } catch {
    try {
      const output = git(['diff', '--name-only', '--diff-filter=AM', base, 'HEAD'])
      return output.trim().split('\n').filter(Boolean)
    } catch (error) {
      console.error(`Failed to get changed files against base "${base}"`)
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
  if (/(^|\/).*\.test\.(js|jsx|cjs|mjs)$/.test(normalizedPath)) return false

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
