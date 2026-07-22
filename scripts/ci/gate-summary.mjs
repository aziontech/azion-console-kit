/**
 * Renders the pre-merge gate verdict as ONE human-readable report in
 * GITHUB_STEP_SUMMARY — spec ci-maturity, req 6.3/6.3.1.
 *
 * Two sections:
 *   1. Totals table per suite (functional shards summed) — nobody sums shards
 *      by hand.
 *   2. When something failed: "Onde e por quê" — which suite, which tests,
 *      which assert message, plus the run URL.
 *
 * Usage: node scripts/ci/gate-summary.mjs <summaries-dir>
 *   <summaries-dir> holds the suite-summary-*.json artifacts downloaded by the
 *   gate job. Jobs that were skipped (path filter) simply have no file here.
 *
 * This script only REPORTS. The gate's pass/fail verdict stays in the
 * workflow's evaluate step (single responsibility).
 */
import { readFileSync, readdirSync, appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const summariesDir = process.argv[2]
if (!summariesDir) {
  // eslint-disable-next-line xss/no-mixed-html -- "<...>" are CLI usage placeholders, not HTML
  console.error('usage: node gate-summary.mjs <summaries-dir>')
  process.exit(1)
}

const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : null

const loadSummaries = () => {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: path comes from the workflow-controlled CLI argument, not user input
  if (!existsSync(summariesDir)) return []
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: path comes from the workflow-controlled CLI argument, not user input
  return readdirSync(summariesDir, { recursive: true })
    .filter((file) => String(file).endsWith('.json'))
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI gate script: reads only the gate's own downloaded artifacts dir
    .map((file) => JSON.parse(readFileSync(join(summariesDir, String(file)), 'utf8')))
}

// Functional shards report separately — merge them into one "functional" row.
const mergeShards = (summaries) => {
  const merged = new Map()
  for (const item of summaries) {
    const key = item.suite.replace(/-shard-\d+$/, '')
    const row = merged.get(key) ?? {
      suite: key,
      total: 0,
      passed: 0,
      failed: 0,
      failures: [],
      reportMissing: false
    }
    row.total += item.total
    row.passed += item.passed
    row.failed += item.failed
    row.failures.push(...item.failures)
    row.reportMissing = row.reportMissing || Boolean(item.reportMissing)
    merged.set(key, row)
  }
  return [...merged.values()]
}

const suites = mergeShards(loadSummaries())
const lines = []

lines.push('# Pre-merge gate — laudo consolidado', '')
lines.push('## Totais por suíte', '')
lines.push('| Suíte | Passou | Total | Status |')
lines.push('| --- | --- | --- | --- |')
for (const suite of suites) {
  const status = suite.reportMissing ? '⚠️ sem relatório' : suite.failed === 0 ? '✅' : '❌'
  lines.push(`| ${suite.suite} | ${suite.passed} | ${suite.total} | ${status} |`)
}
if (suites.length === 0) {
  lines.push('| _nenhuma suíte reportou (PR fora do escopo dos path-filters)_ | — | — | — |')
}

const broken = suites.filter((suite) => suite.failed > 0 || suite.reportMissing)
if (broken.length > 0) {
  lines.push('', '## Onde e por quê falhou', '')
  for (const suite of broken) {
    lines.push(`### Suíte: \`${suite.suite}\``, '')
    if (suite.reportMissing) {
      lines.push('- ⚠️ A suíte quebrou **antes de reportar** (crash de setup/infra). Veja o log do job.')
    }
    for (const failure of suite.failures) {
      lines.push(`- **${failure.name}**`)
      lines.push('  ```')
      lines.push(...failure.message.split('\n').map((line) => `  ${line}`))
      lines.push('  ```')
    }
  }
  if (runUrl) {
    lines.push('', `🔗 [Abrir o run completo](${runUrl})`)
  }
}

const output = lines.join('\n') + '\n'
if (process.env.GITHUB_STEP_SUMMARY) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- GITHUB_STEP_SUMMARY is set by the GitHub Actions runner itself
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, output)
} else {
  console.error(output)
}
