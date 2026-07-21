import { mergeConfig, defineConfig } from 'vite'
import baseConfig from './vitest.config'

// Vitest config used ONLY by StrykerJS (stryker.config.mjs), NOT by the CI unit
// job. It extends the unit config but narrows the test set to the versioning
// suites that actually exercise the mutated modules.
//
// Why narrow: Stryker's dry run executes the ENTIRE included suite once to
// record per-test coverage. Running all ~5970 files' tests there is (a) slow
// and (b) fragile — an unrelated test (`list-table-readonly.test.js`) reads a
// table-definition fixture whose path resolves to `undefined` inside Stryker's
// copied sandbox, which aborts the whole run. Mutants live only in the pure
// versioning modules, so only the versioning suites can kill them; scoping the
// run to those suites is both correct and faster.
//
// Consequence for the score: this is a FLOOR. A mutant that only a broader,
// non-versioning suite would kill is reported as survived here. Widen this
// include if that undercount matters once the gate is calibrated.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [
        'src/tests/composables/versioning/**/*.{test,spec}.js',
        'src/tests/services/v2/versioning/**/*.{test,spec}.js'
      ],
      // Coverage collection is redundant under mutation testing (Stryker
      // disables it in its own vitest bootstrap); keep it off to save time.
      coverage: { enabled: false }
    }
  })
)
