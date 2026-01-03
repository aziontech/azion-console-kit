/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-prettier/skip-formatting'
  ],
  overrides: [
    {
      files: ['cypress/**/*.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended'],
      rules: {
        'cypress/unsafe-to-chain-command': 'warn',
        'cypress/no-unnecessary-waiting': 'warn',
        'no-unused-vars': 'warn',
        'id-length': 'off'
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
