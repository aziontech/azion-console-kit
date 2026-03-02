#!/usr/bin/env node

/**
 * index.js - Architecture Conformance Report
 *
 * Entry point that orchestrates the scan, scoring, and reporting pipeline.
 * Runs ESLint programmatically to collect azion-architecture/* violations,
 * calculates per-module conformance scores, and outputs a markdown or JSON report.
 *
 * Usage:
 *   node scripts/architecture-report/index.js [options]
 *
 * Options:
 *   --format <markdown|json>  Output format (default: markdown)
 *   --output <file>           Write report to file instead of stdout
 *
 * Exit code is always 0 (reports are informational, not blocking).
 */
const fs = require('fs')
const path = require('path')
const { scan } = require('./scanner.cjs')
const { calculateScores } = require('./scorer.cjs')
const { format } = require('./reporter.cjs')

/**
 * Parses CLI arguments into an options object.
 *
 * @param {string[]} argv - Process arguments (process.argv.slice(2))
 * @returns {{ format: 'markdown'|'json', output: string|null }}
 */
function parseArgs(argv) {
  const options = {
    format: 'markdown',
    output: null
  }

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--format' && argv[i + 1]) {
      const value = argv[i + 1].toLowerCase()
      if (value === 'json' || value === 'markdown') {
        options.format = value
      } else {
        console.error(`Invalid format "${argv[i + 1]}". Use "markdown" or "json".`)
        process.exit(1)
      }
      i++
    } else if (argv[i] === '--output' && argv[i + 1]) {
      options.output = argv[i + 1]
      i++
    } else if (argv[i] === '--help' || argv[i] === '-h') {
      console.log(`
Architecture Conformance Report

Usage:
  node scripts/architecture-report/index.js [options]

Options:
  --format <markdown|json>  Output format (default: markdown)
  --output <file>           Write report to file instead of stdout
  --help, -h                Show this help message
`)
      process.exit(0)
    }
  }

  return options
}

/**
 * Main execution function.
 * Orchestrates: scan -> score -> format -> output.
 */
async function main() {
  const options = parseArgs(process.argv.slice(2))

  console.error('Scanning codebase for architecture violations...')

  const scanResults = await scan()

  console.error('Calculating conformance scores...')

  const scores = calculateScores(scanResults)

  const report = format(scores, options.format)

  if (options.output) {
    const outputPath = path.resolve(process.cwd(), options.output)
    const outputDir = path.dirname(outputPath)
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    fs.writeFileSync(outputPath, report, 'utf-8')
    console.error(`Report written to ${outputPath}`)
  } else {
    console.log(report)
  }
}

main().catch((error) => {
  console.error('Failed to generate architecture report:', error.message)
  process.exit(0) // Informational — do not block CI
})
