/**
 * Coverage RATCHET (spec test-effectiveness, req 8): per-area line-coverage
 * floors that only move UP. The baseline froze the repo's current state —
 * no legacy debt must be paid to stay green; only REGRESSION fails
 * ("catraca, não big bang").
 *
 * Usage:
 *   node scripts/check-coverage-ratchet.mjs [coverage-summary.json]           # check
 *   node scripts/check-coverage-ratchet.mjs [coverage-summary.json] --write   # raise floors
 *
 * Rules:
 *   - fails when any area drops more than TOLERANCE below its floor;
 *   - --write raises floors to the current value but NEVER lowers them
 *     (a deliberate lowering requires editing the baseline by hand, in a
 *     reviewed diff with a written reason).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const AREAS = [
  'src/services',
  'src/views',
  'src/helpers',
  'src/plugins',
  'src/modules',
  'src/composables',
  'src/stores',
  'src/templates',
  'src/router',
  'src/components',
  'src/utils'
]
const TOLERANCE = 0.2 // percentage points — absorbs float/parallelism jitter
const BASELINE_PATH = 'tests/coverage-ratchet-baseline.json'

const args = process.argv.slice(2)
const write = args.includes('--write')
const summaryPath =
  args.find((arg) => !arg.startsWith('--')) ?? 'coverage/unit/coverage-summary.json'

// eslint-disable-next-line security/detect-non-literal-fs-filename -- CI script: path comes from the workflow-controlled CLI argument
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'))

const totals = Object.fromEntries(AREAS.map((area) => [area, { covered: 0, total: 0 }]))
for (const [file, data] of Object.entries(summary)) {
  if (file === 'total') continue
  const area = AREAS.find((prefix) => file.includes(`/${prefix}/`) || file.startsWith(`${prefix}/`))
  if (!area || !data.lines) continue
  totals[area].covered += data.lines.covered
  totals[area].total += data.lines.total
}

const current = Object.fromEntries(
  AREAS.map((area) => {
    const { covered, total } = totals[area]
    return [area, { lines: total === 0 ? 100 : Math.round((covered / total) * 10000) / 100 }]
  })
)

if (!existsSync(BASELINE_PATH)) {
  if (!write) {
    console.error(
      `coverage-ratchet: no baseline at ${BASELINE_PATH} — run with --write to freeze the current state`
    )
    process.exit(1)
  }
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2) + '\n')
  console.error('coverage-ratchet: baseline created (current state frozen)')
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
const failures = []
const raised = []

for (const area of AREAS) {
  const floor = baseline[area]?.lines ?? 0
  const now = current[area].lines
  if (now < floor - TOLERANCE) {
    failures.push(
      `  ${area}: ${now}% < piso ${floor}% (regressão de ${(floor - now).toFixed(2)} p.p. — a mudança chegou sem testes)`
    )
  } else if (write && now > floor) {
    baseline[area] = { lines: now }
    raised.push(`  ${area}: ${floor}% → ${now}%`)
  }
}

if (failures.length > 0) {
  console.error('coverage-ratchet FAILED — cobertura caiu abaixo do piso:')
  for (const failure of failures) console.error(failure)
  console.error('O piso NUNCA desce por --write; regressão exige testes, não rebaixamento.')
  process.exit(1)
}

if (write && raised.length > 0) {
  writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + '\n')
  console.error(`coverage-ratchet: pisos elevados:\n${raised.join('\n')}`)
} else {
  console.error('coverage-ratchet PASSED (nenhuma área abaixo do piso)')
}
