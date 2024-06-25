import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      passWithNoTests: true,
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
        'public'
      ],
      root: fileURLToPath(new URL('./', import.meta.url)),
      transformMode: {
        web: [/\.[jt]sx$/]
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
        statements: 91,
        branches: 91,
        functions: 91,
        lines: 91,
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
