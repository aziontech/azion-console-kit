/* eslint-env node */
import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { playwright } from '@vitest/browser-playwright'
import viteConfig from './vite.config'

/**
 * Functional suite — Vitest BROWSER MODE (real Chromium via Playwright).
 *
 * Deliberately a SEPARATE config from vitest.config.js: the unit CI job runs
 * `vitest run --coverage` inside node:22-alpine (no Chromium available), so the
 * browser project must never be picked up by the default config. Keeping this
 * file separate guarantees `test:unit:*` behavior stays byte-identical.
 *
 * Scope: versioning (VersionShell) components — spec
 * `specs/versioning-test-coverage` (design ADR 7.1: Vitest browser mode).
 * Run with `yarn test:functional`.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    // Pre-bundle Vue and the PrimeVue pieces the versioning components render
    // together, in ONE optimized chunk, so there is a single Vue runtime. Without
    // this, a component whose scoped slot renders a nested <slot> across the
    // prebundle boundary (e.g. VersionListDataView inside PrimeVue DataView) hits
    // `currentRenderingInstance === null` — two Vue copies (design ADR 7.1).
    optimizeDeps: {
      include: [
        'vue',
        'primevue/dataview',
        'primevue/menu',
        'primevue/overlaypanel',
        'primevue/inputswitch',
        'primevue/dialog',
        'primevue/config',
        'primevue/tooltip'
      ]
    },
    test: {
      name: 'functional',
      include: ['src/tests/functional/**/*.browser.test.js'],
      setupFiles: ['src/tests/functional/setup-functional.js'],
      // Real browser: no jsdom fakes for focus/layout/Teleport — anti-placebo
      // by construction (rule: .claude/rules/testing-versioning.md).
      browser: {
        enabled: true,
        provider: playwright(),
        headless: true,
        instances: [{ browser: 'chromium' }],
        // Never fall back to a simulated DOM — a missing browser must fail loudly.
        ui: false
      },
      retry: process.env.CI ? 2 : 0,
      root: fileURLToPath(new URL('./', import.meta.url)),
      // Coverage is collected by the CI functional job and merged with the unit
      // lcov via monocart (spec task 14.1); disabled by default to keep the
      // local loop fast.
      coverage: {
        enabled: false,
        // v8 provider works in Vitest 4 browser mode (Chromium/Playwright) with no
        // extra config: coverage-v8 collects native V8 data via CDP and converts it
        // to Istanbul for the reporters below. Verified locally producing
        // coverage/functional/{lcov.info,coverage-final.json} (spec task 14.1).
        provider: 'v8',
        // 'json' emits coverage-final.json (Istanbul) — the input the merge script
        // feeds to monocart to build the unified Sonar lcov (scripts/merge-coverage.mjs).
        reporter: ['text', 'lcov', 'json'],
        reportsDirectory: './coverage/functional',
        include: [
          'src/composables/versioning/**',
          'src/templates/version-shell-block/**',
          'src/components/VersionListDataView/**'
        ]
      },
      testTimeout: 30000
    }
  })
)
