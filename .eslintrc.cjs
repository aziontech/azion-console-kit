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
      // Performance: TanStack Vue Query integration is mandatory
      files: [
        'src/modules/**/*',
        'src/services/v2/**/*',
        'src/views/**/*',
        'src/services/*-services/**/*',
        'src/components/**/*',
        'src/stores/**/*'
      ],
      rules: {
        // Performance — error: TanStack integration is required
        'azion-architecture/no-direct-http-in-components': 'error',
        'azion-architecture/no-http-in-stores': 'error',
        'azion-architecture/require-vue-query': 'error',

        // Best practices — warn: encourage but don't block
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/services-http-only': 'warn',
        'azion-architecture/pure-adapters': 'warn',
        'azion-architecture/no-http-in-adapters': 'warn',

        // Architecture — off
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
