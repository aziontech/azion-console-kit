/* eslint-env node */
/**
 * merge-coverage.mjs — unify unit + functional coverage into ONE lcov for Sonar.
 *
 * PURPOSE (spec task 14.1, versioning-test-coverage)
 * --------------------------------------------------
 * The versioning test coverage is produced by two DISTINCT runners:
 *   - unit  (jsdom)   → vitest.config.js            → ./coverage/unit
 *   - functional (browser/Chromium via Playwright) → vitest.functional.config.js
 *                                                   → ./coverage/functional
 * Sonar reads a SINGLE `lcov.info`. This script merges both into
 * ./coverage/merged/lcov.info so `sonar.javascript.lcov.reportPaths` points at
 * one file that reflects the whole suite.
 *
 * STRATEGY (option "a" — monocart-native, no new dependency)
 * ----------------------------------------------------------
 * Both vitest configs emit `coverage-final.json` (Istanbul format, via the
 * `json` reporter). monocart-coverage-reports `CoverageReport.add()` accepts
 * Istanbul-format objects directly (see node_modules/monocart-coverage-reports
 * /lib/index.d.ts: `add(coverageData: any[] | any)` — array = V8, object =
 * Istanbul). We `add()` each report then `generate()` the `lcovonly` report.
 *
 * We deliberately do NOT use monocart's `inputDir` merge: that path expects
 * monocart's own `raw` V8 dumps, which vitest does not produce. Feeding the two
 * Istanbul `coverage-final.json` files through `add()` is the supported merge
 * path for already-instrumented reports.
 *
 * The unit and functional `include` globs are disjoint (unit: services/views/
 * helpers/plugins/modules; functional: composables/versioning + templates/
 * version-shell-block + components/VersionListDataView), so the merge is a
 * union with no per-file range reconciliation to worry about. monocart still
 * merges correctly if that ever overlaps.
 *
 * CI WIRING (future — spec task 14.2 / 16.1, NOT done here)
 * ---------------------------------------------------------
 * The functional job runs sharded (`--shard=N/2`), so CI must collect the
 * per-shard `coverage/functional/coverage-final.json` artifacts plus the unit
 * `coverage/unit/coverage-final.json`, place them where this script expects
 * them (or extend INPUTS), then run `yarn coverage:merge` before the Sonar
 * scan step. This script only merges what is present locally; the artifact
 * plumbing is out of scope for task 14.1.
 *
 * USAGE
 * -----
 *   yarn test:unit:coverage            # writes coverage/unit/coverage-final.json
 *   yarn test:functional:coverage      # writes coverage/functional/coverage-final.json
 *   yarn coverage:merge                # -> coverage/merged/lcov.info (+ stdout summary)
 */

import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { CoverageReport } from 'monocart-coverage-reports'

const ROOT = path.resolve(fileURLToPath(new URL('../', import.meta.url)))

/**
 * Istanbul `coverage-final.json` inputs to merge. Each entry is optional: a
 * missing file is skipped with a warning rather than failing the merge, so the
 * script stays useful when only one suite has run locally.
 */
const INPUTS = [
  { label: 'unit', file: path.join(ROOT, 'coverage/unit/coverage-final.json') },
  { label: 'functional', file: path.join(ROOT, 'coverage/functional/coverage-final.json') }
]

const OUTPUT_DIR = path.join(ROOT, 'coverage/merged')

async function main() {
  const report = new CoverageReport({
    name: 'Versioning Unified Coverage (unit + functional)',
    outputDir: OUTPUT_DIR,
    // baseDir makes lcov SF: paths relative to the repo root, which is what
    // Sonar resolves against.
    baseDir: ROOT,
    // lcovonly -> coverage/merged/lcov.info (the file Sonar reads);
    // console-summary prints the merged totals to stdout.
    reports: ['lcovonly', 'console-summary'],
    lcov: true,
    clean: true,
    cleanCache: true,
    logging: 'info'
  })

  const added = []
  for (const { label, file } of INPUTS) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI script: INPUTS is a hardcoded list of repo coverage paths
    if (!existsSync(file)) {
      // eslint-disable-next-line no-console
      console.warn(`[merge-coverage] SKIP ${label}: not found at ${path.relative(ROOT, file)}`)
      continue
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- CI script: INPUTS is a hardcoded list of repo coverage paths
    const data = JSON.parse(readFileSync(file, 'utf8'))
    const fileCount = Object.keys(data).length
    await report.add(data)
    added.push({ label, fileCount, file })
    // eslint-disable-next-line no-console
    console.log(`[merge-coverage] added ${label}: ${fileCount} file(s) from ${path.relative(ROOT, file)}`)
  }

  if (added.length === 0) {
    // eslint-disable-next-line no-console
    console.error('[merge-coverage] no coverage-final.json inputs found; nothing to merge')
    process.exit(1)
  }

  const result = await report.generate()
  const lcovPath = path.join(OUTPUT_DIR, 'lcov.info')

  // eslint-disable-next-line no-console
  console.log('\n[merge-coverage] merged report written:')
  // eslint-disable-next-line no-console
  console.log(`  lcov:     ${path.relative(ROOT, lcovPath)}`)
  if (result?.summary?.lines) {
    const { lines } = result.summary
    // eslint-disable-next-line no-console
    console.log(`  lines:    ${lines.covered}/${lines.total} (${lines.pct}%)`)
  }
  // eslint-disable-next-line no-console
  console.log(`  sources:  ${added.map((a) => `${a.label}=${a.fileCount}`).join(', ')}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[merge-coverage] failed:', err)
  process.exit(1)
})
