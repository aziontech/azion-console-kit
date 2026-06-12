/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

// Register the architecture plugin so eslint-disable directives for its rules
// don't fail. Rule severities live in .eslintrc-architecture.cjs.
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
  // Register security/xss/no-unsanitized plugins so eslint-disable directives for their rules
  // (added for .eslintrc-security.cjs) don't fail this main lint pass. Rule severities for those
  // plugins are configured in .eslintrc-security.cjs — here they stay 'off' (default).
  plugins: ['azion-architecture', 'security', 'xss', 'no-unsanitized'],
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
      files: ['scripts/**/*.cjs'],
      env: { node: true },
      rules: {
        'no-console': 'off',
        'id-length': 'off'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  rules: {
    'no-case-declarations': 0,
    // Reliability — applies repo-wide, not gated by tier.
    // navigator.clipboard.writeText() returns a Promise; ignoring it hides
    // permission rejections and lost-focus failures that silently break copy UX.
    'azion-architecture/no-unawaited-clipboard': 'error',
    'no-console': ['error', { allow: ['error'] }],
    'id-length': ['error', { min: 2 }]
  }
}
