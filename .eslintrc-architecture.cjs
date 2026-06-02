/* eslint-env node */

// Resolve local architecture plugin without external dependencies.
const Module = require('module')
const resolveFilename = Module._resolveFilename
Module._resolveFilename = function (request, parent, isMain, options) {
  if (request === 'eslint-plugin-azion-architecture') {
    return require.resolve(`${__dirname}/eslint/plugin`)
  }
  return resolveFilename.call(this, request, parent, isMain, options)
}

module.exports = {
  root: true,
  plugins: ['azion-architecture'],
  // vue3-essential brings in vue-eslint-parser so .vue SFCs parse correctly
  extends: ['plugin:vue/vue3-essential'],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  overrides: [
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
        'src/services/!(v2|axios)/**/*',
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
        'azion-architecture/module-isolation': 'off',
        'azion-architecture/naming-convention': 'off',
        'azion-architecture/type-separation': 'off'
      }
    }
  ]
}
