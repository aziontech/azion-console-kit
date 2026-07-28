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
      files: ['scripts/**/*.cjs'],
      env: { node: true },
      rules: {
        'no-console': 'off',
        'id-length': 'off'
      }
    },
    // Billing boundary: the plans experience (billing-api v4) and the managed
    // experience (legacy billing, kept for internal/custom accounts) must stay
    // independent. Mixing them is how the legacy path silently breaks.
    {
      files: [
        'src/services/v2/billing-api/**',
        'src/composables/billing/**',
        'src/composables/useSubscription*.js',
        'src/composables/useCurrentSubscription.js',
        'src/composables/useCheckoutSessionPreparer.js',
        'src/composables/useLatestInvoice.js'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/services/v2/billing-legacy/**', '**/composables/billing-legacy/**'],
                message:
                  'The plans experience must not import legacy billing. Use services/v2/billing-api instead — see src/services/v2/billing-api/README.md.'
              }
            ]
          }
        ]
      }
    },
    {
      files: [
        'src/services/v2/billing-legacy/**',
        'src/composables/billing-legacy/**',
        'src/views/Billing/legacy/**'
      ],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/services/v2/billing-api/**', '**/composables/billing/**'],
                message:
                  'Legacy billing is frozen for managed accounts and must not depend on billing-api v4 — see src/services/v2/billing-legacy/README.md.'
              }
            ]
          }
        ]
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
