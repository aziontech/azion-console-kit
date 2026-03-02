/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

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
      // Modern code: warn initially, promote to error once existing violations are fixed
      files: ['src/modules/**/*', 'src/services/v2/**/*'],
      rules: {
        'azion-architecture/no-direct-http-in-components': 'warn',
        'azion-architecture/no-http-in-stores': 'warn',
        'azion-architecture/require-vue-query': 'warn',
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/services-http-only': 'warn',
        'azion-architecture/pure-adapters': 'warn',
        'azion-architecture/no-http-in-adapters': 'warn',
        'azion-architecture/module-isolation': 'warn',
        'azion-architecture/naming-convention': 'warn',
        'azion-architecture/type-separation': 'warn'
      }
    },
    {
      files: [
        'src/views/**/*',
        'src/services/*-services/**/*',
        'src/components/**/*',
        'src/stores/**/*'
      ],
      rules: {
        'azion-architecture/no-direct-http-in-components': 'warn',
        'azion-architecture/no-http-in-stores': 'warn',
        'azion-architecture/require-vue-query': 'warn',
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/services-http-only': 'warn',
        'azion-architecture/pure-adapters': 'warn',
        'azion-architecture/no-http-in-adapters': 'warn',
        'azion-architecture/module-isolation': 'warn',
        'azion-architecture/naming-convention': 'warn',
        'azion-architecture/type-separation': 'warn'
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
