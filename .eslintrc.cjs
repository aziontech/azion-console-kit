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
      // versioned-only-subresources feature scope: design-system lint is a
      // build-breaker (task 9.3). New/touched lines must use
      // @aziontech/webkit + @aziontech/theme tokens — no raw colors,
      // Tailwind palette/typography/spacing/radius/shadow utilities.
      files: [
        'src/templates/version-shell-block/**/*.{vue,js}',
        'src/composables/versioning/**/*.{vue,js}',
        'src/views/EdgeFunctions/v6/**/*.{vue,js}',
        'src/views/NetworkLists/v6/**/*.{vue,js}',
        'src/views/WafRules/v6/**/*.{vue,js}'
      ],
      rules: {
        'azion-architecture/no-raw-design-values': 'error'
      }
    },
    {
      // deploy-drawer-block belongs to the new-release-drawer feature and is being
      // refactored there with the project's existing utilities; keep the DS rule a
      // non-blocking warning so it does not gate that feature mid-flight.
      files: ['src/templates/deploy-drawer-block/**/*.{vue,js}'],
      rules: {
        'azion-architecture/no-raw-design-values': 'warn'
      }
    },
    {
      files: ['cypress/**/*.{cy,spec}.{js,ts,jsx,tsx}'],
      extends: ['plugin:cypress/recommended']
    },
    {
      files: ['scripts/**/*.{cjs,mjs}'],
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
    'no-console': ['error', { allow: ['error'] }],
    'id-length': ['error', { min: 2 }]
  }
}
