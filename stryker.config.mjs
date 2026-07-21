// @ts-check
/**
 * StrykerJS — mutation testing for the versioning feature.
 *
 * This is the automation behind anti-placebo requirement 1.4 of
 * `specs/versioning-test-coverage`: "prove the tests fail against broken code".
 * Line/branch coverage only proves a line RAN; mutation testing proves the
 * suite actually ASSERTS the behavior — Stryker injects defects (flips `>` to
 * `>=`, drops a branch, changes a return) and a surviving mutant is a line the
 * tests execute but never check. A survivor is exactly a placebo made visible.
 *
 * Scope is deliberately small and high-value: only the PURE logic modules of
 * versioning (state machine, capability resolution, action derivation, option
 * mapping, response adapter). These are covered by a strong unit suite
 * (including fast-check PBTs) and carry no Vue reactivity or view rendering —
 * so mutants are meaningful and runs stay fast. Composables that touch Vue
 * refs/watchers/components are intentionally OUT: they add noise and time
 * without proportional signal at this stage.
 *
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
const config = {
  // The UNIT jsdom suite is what kills mutants. The functional/browser suite
  // (vitest.functional.config.js) is intentionally excluded — real-Chromium
  // runs are far too slow for per-mutant execution.
  //
  // We point Stryker at `vitest.mutation.config.js` (NOT `vitest.config.js`
  // directly) — it extends the unit config but narrows the test set to the
  // versioning suites. Stryker's dry run runs the whole included suite once to
  // record per-test coverage; scoping it avoids an unrelated sandbox-fragile
  // test (`list-table-readonly.test.js`, a fixture path that resolves to
  // `undefined` inside Stryker's copied sandbox) aborting the run, and keeps
  // runs fast. Mutants live only in the pure versioning modules, so only the
  // versioning suites can kill them. See vitest.mutation.config.js for detail.
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.mutation.config.js'
  },

  // Only the pure, high-value versioning logic. Start small; widen once the
  // score is understood and the gate is calibrated.
  mutate: [
    'src/composables/versioning/version-machine.js',
    'src/composables/versioning/version-capability.js',
    'src/composables/versioning/version-actions.js',
    'src/composables/versioning/to-version-options.js',
    'src/services/v2/versioning/version-adapter.js'
  ],

  // 'perTest' is the vitest-runner default: for each mutant Stryker runs ONLY
  // the tests whose recorded coverage touches the mutated code, instead of the
  // whole suite. This is the main performance lever. The vitest-runner records
  // per-test coverage via its own setup hook (see
  // node_modules/@stryker-mutator/vitest-runner) and merges it per test id.
  coverageAnalysis: 'perTest',

  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation-report.html'
  },

  // Thresholds are REPORTING-ONLY for now: `break: null` means Stryker will
  // surface the score (and color the report) but never fail the build. The
  // numeric gate is calibrated later (design ADR / open question Q8) once we
  // have a real baseline from these modules. Do NOT set `break` to a number
  // until that calibration lands.
  thresholds: {
    high: 90,
    low: 80,
    break: null
  },

  // Re-runs mutate only what changed since the last run, reusing prior results.
  incremental: true,
  incrementalFile: 'reports/mutation/stryker-incremental.json'
}

export default config
