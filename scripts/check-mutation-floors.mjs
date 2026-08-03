/**
 * Per-module mutation-score floors (spec test-effectiveness, req 4.2).
 * Stryker's own `break` only guards the AGGREGATE score — a single module's
 * asserts could rot without moving the total. This script reads the json
 * report and FAILS when any module drops below its committed floor
 * (tests/mutation-floors.json). Floors only move up.
 *
 * Usage: node scripts/check-mutation-floors.mjs [mutation-report.json]
 */
import { readFileSync } from 'node:fs'

const reportPath = process.argv[2] ?? 'reports/mutation/mutation-report.json'
// eslint-disable-next-line security/detect-non-literal-fs-filename -- CI script: path comes from the workflow-controlled CLI argument
const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const { floors } = JSON.parse(readFileSync('tests/mutation-floors.json', 'utf8'))

const scoreOf = (fileResult) => {
  const detected = fileResult.mutants.filter((mutant) =>
    ['Killed', 'Timeout'].includes(mutant.status)
  ).length
  const undetected = fileResult.mutants.filter((mutant) =>
    ['Survived', 'NoCoverage'].includes(mutant.status)
  ).length
  const total = detected + undetected
  return total === 0 ? 100 : Math.round((detected / total) * 10000) / 100
}

const failures = []
for (const [module, floor] of Object.entries(floors)) {
  const entry = Object.entries(report.files ?? {}).find(([file]) => file.endsWith(module))
  if (!entry) {
    failures.push(`  ${module}: AUSENTE do relatório (saiu do mutate? atualize os pisos)`)
    continue
  }
  const score = scoreOf(entry[1])
  if (score < floor) {
    failures.push(
      `  ${module}: ${score}% < piso ${floor}% (asserts enfraquecidos — o teste roda mas não mata o bug)`
    )
  }
}

if (failures.length > 0) {
  console.error('mutation-floors FAILED:')
  for (const failure of failures) console.error(failure)
  process.exit(1)
}
console.error(`mutation-floors PASSED (${Object.keys(floors).length} módulos no piso ou acima)`)
