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
      deps: {
        inline: ['@aziontech/webkit']
      },
      exclude: [
        ...configDefaults.exclude,
        'e2e/*',
        'cypress',
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
      transformMode: {
        web: [/\.[jt]sx$/, /\.vue$/]
      },
      coverage: {
        enabled: true,
        include: [
          'src/services/**',
          'src/views/**',
          'src/helpers/**',
          'src/plugins/**',
          'src/modules/**'
        ],
        reporter: ['text', 'lcov', 'html'],
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
