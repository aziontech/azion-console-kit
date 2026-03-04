/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

// Resolve local architecture plugin without external dependencies.
// Same technique used by @rushstack/eslint-patch above.
const Module = require('module')
const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'eslint-plugin-azion-architecture') {
    return require.resolve(`${__dirname}/eslint-plugin-azion-architecture`)
  }
  return resolveFilename.call(this, request, parent, isMain, options)
}

module.exports = {
  root: true,
  plugins: ['azion-architecture'],
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  overrides: [
    {
      files: ['cypress/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended']
    },
    {
      // Modern code: TanStack model is mandatory
      files: ['src/modules/**/*', 'src/services/v2/**/*'],
      rules: {
        'azion-architecture/no-direct-http-in-components': 'error',
        'azion-architecture/no-http-in-stores': 'error',
        'azion-architecture/require-vue-query': 'error',
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/services-http-only': 'warn',
        'azion-architecture/pure-adapters': 'warn',
        'azion-architecture/no-http-in-adapters': 'warn',
        'azion-architecture/module-isolation': 'off',
        'azion-architecture/naming-convention': 'off',
        'azion-architecture/type-separation': 'off'
      }
    },
    {
      // azion-ai-chat: SSE streaming — Vue Query not applicable
      files: ['src/modules/azion-ai-chat/**/*'],
      rules: {
        'azion-architecture/require-vue-query': 'off',
        'azion-architecture/no-try-catch-in-services': 'off'
      }
    },
    {
      // Legacy code: tracked for migration, not blocking
      files: [
        'src/views/**/*',
        'src/services/*-services/**/*',
        'src/components/**/*',
        'src/stores/**/*',
        'src/composables/**/*'
      ],
      rules: {
        'azion-architecture/no-direct-http-in-components': 'warn',
        'azion-architecture/no-http-in-stores': 'warn',
        'azion-architecture/require-vue-query': 'warn',
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/services-http-only': 'warn',
        'azion-architecture/pure-adapters': 'warn',
        'azion-architecture/no-http-in-adapters': 'warn',
        'azion-architecture/module-isolation': 'off',
        'azion-architecture/naming-convention': 'off',
        'azion-architecture/type-separation': 'off'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-case-declarations': 0,
    'no-console': 'error',
    'id-length': ['error', { min: 2 }]
  }
}
