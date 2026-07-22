/**
 * Converts a Vitest JSON report into the compact suite summary consumed by the
 * pre-merge gate (scripts/ci/gate-summary.mjs) — spec ci-maturity, req 6.3/6.3.1.
 *
 * Usage: node scripts/ci/suite-summary.mjs <vitest-json> <suite-name> <out-json>
 *
 * Output shape:
 *   { suite, total, passed, failed, failures: [{ name, message }] }
 *
 * Never throws on a missing/invalid input file: the gate must still render a
 * summary when a suite crashed before reporting — it emits a synthetic entry
 * with `reportMissing: true` so the gate can say WHERE the pipeline broke.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const [, , inputPath, suiteName, outPath] = process.argv

if (!inputPath || !suiteName || !outPath) {
  // eslint-disable-next-line xss/no-mixed-html -- "<...>" are CLI usage placeholders, not HTML
  console.error('usage: node suite-summary.mjs <vitest-json> <suite-name> <out-json>')
  process.exit(1)
}

const MESSAGE_LIMIT = 600

const buildSummary = () => {
  let report
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: path comes from the workflow-controlled CLI argument, not user input
    report = JSON.parse(readFileSync(inputPath, 'utf8'))
  } catch (error) {
    return {
      suite: suiteName,
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
      reportMissing: true,
      reason: `vitest JSON report unreadable at ${inputPath}: ${error.message}`
    }
  }

  const failures = (report.testResults ?? []).flatMap((file) =>
    (file.assertionResults ?? [])
      .filter((test) => test.status === 'failed')
      .map((test) => ({
        name: test.fullName || test.title,
        message: (test.failureMessages ?? []).join('\n').slice(0, MESSAGE_LIMIT)
      }))
  )

  return {
    suite: suiteName,
    total: report.numTotalTests ?? 0,
    passed: report.numPassedTests ?? 0,
    failed: report.numFailedTests ?? 0,
    failures
  }
}

const summary = buildSummary()
// eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: path comes from the workflow-controlled CLI argument, not user input
mkdirSync(dirname(outPath), { recursive: true })
// eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: path comes from the workflow-controlled CLI argument, not user input
writeFileSync(outPath, JSON.stringify(summary, null, 2))
console.error(`suite-summary: ${summary.suite} → ${summary.passed}/${summary.total} passed`)
