import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      setupFiles: ['src/tests/setup-tests.js'],
      environment: 'jsdom',
      passWithNoTests: true,
      server: {
        deps: {
          inline: ['@aziontech/webkit']
        }
      },
      exclude: [
        ...configDefaults.exclude,
        // Functional suite runs in BROWSER MODE via vitest.functional.config.js —
        // it must never run under jsdom (real-browser assertions would fail).
        'src/tests/functional/**',
        '.stryker-tmp/**',
        // Playwright-runner specs (contract-drift) — never collected by the unit runner.
        'tests/**',
        'azion',
        '.vscode',
        '.husky',
        '.vite',
        '.github',
        'docs',
        'public',
        'eslint'
      ],
      root: fileURLToPath(new URL('./', import.meta.url)),
      coverage: {
        enabled: true,
        // Honest measurement (spec ci-maturity, req 6.4): every src/ code area is
        // measured. Composables/stores/templates/router/components/utils were
        // previously invisible (392 files with no coverage collected at all).
        // Measurement only — no threshold is enforced here.
        include: [
          'src/services/**',
          'src/views/**',
          'src/helpers/**',
          'src/plugins/**',
          'src/modules/**',
          'src/composables/**',
          'src/stores/**',
          'src/templates/**',
          'src/router/**',
          'src/components/**',
          'src/utils/**'
        ],
        // 'json' emits coverage-final.json (Istanbul), consumed by the merge script
        // to build the unified Sonar lcov (scripts/merge-coverage.mjs, spec task 14.1).
        reporter: ['text', 'lcov', 'html', 'json'],
        reportsDirectory: './coverage/unit'
      },
      // 'json' feeds the pre-merge gate summary (scripts/ci/suite-summary.mjs):
      // totals + failed-test names/messages consolidated in one place
      // (spec ci-maturity, req 6.3/6.3.1). Keeping it in the config (not a CLI
      // flag) preserves the CI command byte-identical.
      reporters: ['default', 'vitest-sonar-reporter', 'json'],
      outputFile: {
        'vitest-sonar-reporter': './coverage/unit/sonar-report.xml',
        json: './coverage/unit/vitest-summary.json'
      },
      testTimeout: 30000
    }
  })
)
