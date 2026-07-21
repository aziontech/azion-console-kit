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
        include: [
          'src/services/**',
          'src/views/**',
          'src/helpers/**',
          'src/plugins/**',
          'src/modules/**'
        ],
        // 'json' emits coverage-final.json (Istanbul), consumed by the merge script
        // to build the unified Sonar lcov (scripts/merge-coverage.mjs, spec task 14.1).
        reporter: ['text', 'lcov', 'html', 'json'],
        reportsDirectory: './coverage/unit'
      },
      reporters: ['default', 'vitest-sonar-reporter'],
      outputFile: {
        'vitest-sonar-reporter': './coverage/unit/sonar-report.xml'
      },
      testTimeout: 30000
    }
  })
)
