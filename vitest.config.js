import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      setupFiles: ['src/tests/setup-tests.js'],
      // Environment INVERSION (spec test-effectiveness, req 1.1): pure-logic
      // directories run in plain NODE — no fake DOM available to lie (a jsdom
      // no-op passes silently where node throws ReferenceError). Component
      // directories keep jsdom as a TRANSITION bucket (req 6: new tests are
      // born in node or browser mode, never here). A per-file
      // `@vitest-environment` docblock overrides the project env — used by
      // the browser-coupled stragglers (req 2, map in GUIA-DE-TESTES).
      projects: [
        {
          extends: true,
          test: {
            name: 'unit-node',
            environment: 'node',
            include: [
              'src/tests/services/**/*.{test,spec}.js',
              'src/tests/helpers/**/*.{test,spec}.js',
              'src/tests/modules/**/*.{test,spec}.js',
              'src/tests/router/**/*.{test,spec}.js',
              'src/tests/stores/**/*.{test,spec}.js',
              'src/tests/plugins/**/*.{test,spec}.js',
              'src/tests/contracts/**/*.{test,spec}.js',
              'src/tests/utils/**/*.{test,spec}.js',
              'src/tests/regression/**/*.{test,spec}.js',
              // Co-located pure suites (0 component mounts, verified in the
              // wave-1 census; the 2 mounting files carry a jsdom docblock):
              'src/services/**/__tests__/**/*.{test,spec}.js',
              'src/components/base/advanced-filter-system-v2/filterAQL/__tests__/**/*.{test,spec}.js',
              'src/views/RealTimeEventsV2/__tests__/**/*.{test,spec}.js',
              'src/views/RealTimeEventsV2/composables/__tests__/**/*.{test,spec}.js',
              // flag-v6 stays in unit-dom: its per-resource files look pure,
              // but the SHARED legacy-smoke contract mounts real views.
              'src/tests/composables/**/*.{test,spec}.js'
            ]
          }
        },
        {
          extends: true,
          test: {
            name: 'unit-dom',
            environment: 'jsdom',
            // Conservative catch-all: everything not claimed by unit-node
            // (components, templates, views, composables, flag-v6, hooks, the
            // CO-LOCATED suites outside src/tests — e.g. src/**/__tests__ and
            // *.prop tests — and any NEW directory) stays on today's behavior
            // until promoted. P1 (orphan guard) caught the first version of
            // this glob dropping 79 co-located files.
            include: ['src/**/*.{test,spec}.js'],
            exclude: [
              'src/tests/services/**',
              'src/tests/helpers/**',
              'src/tests/modules/**',
              'src/tests/router/**',
              'src/tests/stores/**',
              'src/tests/plugins/**',
              'src/tests/contracts/**',
              'src/tests/utils/**',
              'src/tests/regression/**',
              'src/tests/functional/**',
              'src/services/**/__tests__/**',
              'src/components/base/advanced-filter-system-v2/filterAQL/__tests__/**',
              'src/views/RealTimeEventsV2/__tests__/**',
              'src/views/RealTimeEventsV2/composables/__tests__/**',
              'src/tests/composables/**'
            ]
          }
        }
      ],
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
        // 'json-summary' feeds the coverage RATCHET (spec test-effectiveness,
        // req 8): per-area floors that only move up. Additive — lcov/sonar
        // consumers are untouched.
        reporter: ['text', 'lcov', 'html', 'json', 'json-summary'],
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
