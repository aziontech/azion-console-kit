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
  // Binary test artifacts (browser-mode screenshots, vitest attachments) are not
  // source: the anti-placebo lint globs match their `*version*`/`__screenshots__`
  // paths, so exclude them explicitly to avoid parse errors on non-JS files.
  ignorePatterns: ['**/__screenshots__/**', '**/*.png', '.vitest-attachments/**'],
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
      // new-release-screen feature (spec new-release-screen, Property 1).
      // The full-page "Review & deploy" surface and its canonical, surface-agnostic
      // composition blocks (relocated from deploy-drawer-block). The design-system
      // rule (no raw hex/rgb, fixed-size/palette/typography utilities, non-token
      // shadows) is a build-breaker on these paths: the feature is complete and the
      // shared blocks are relocated, so it is promoted to error (task 15.1). The
      // release store carries no markup, so it is excluded.
      files: [
        'src/views/Deployments/v6/**/*.{vue,js}',
        'src/templates/release-composition/**/*.{vue,js}'
      ],
      rules: {
        'azion-architecture/no-raw-design-values': 'error'
      }
    },
    // NOTE: the legacy cypress override was removed here (spec
    // versioning-test-coverage, req 8.5): the cypress/ tree no longer exists in
    // the repo and eslint-plugin-cypress is not installed — the block was dead
    // config that broke any eslint invocation resolving it.
    {
      // Anti-placebo test rules (spec versioning-test-coverage, req 1.x).
      // RATCHET SCOPE: the hard bar applies only to versioning test paths and
      // the new tests/ tree — legacy tests are grandfathered (design ADR 7.8).
      // Source of truth: .claude/rules/testing-versioning.md
      files: [
        'src/tests/**/*version*',
        'src/tests/**/versioning/**',
        'src/tests/**/v6/**',
        'src/tests/functional/**',
        // flag-v6 coverage suites (spec flag-v6-coverage, req 8.2) — born under
        // the hard bar from the first commit.
        'src/tests/**/flag-v6/**',
        // test-maturity fase 2 (critical areas) — ratchet: new tests under the bar.
        'src/tests/services/v2/base/**',
        'src/tests/services/v2/mfa/**',
        'src/tests/services/v2/payment/**',
        'src/tests/services/v2/billing/**',
        'tests/**'
      ],
      plugins: ['vitest'],
      rules: {
        // P1 — no committed escape hatches (req 1.5)
        'vitest/no-focused-tests': 'error',
        'vitest/no-disabled-tests': 'error',
        // P2 — every test asserts; asserts live inside tests (req 1.1)
        'vitest/expect-expect': 'error',
        'vitest/no-standalone-expect': 'error',
        // P2 — no internal-state/class-string asserts (req 1.1, 1.7)
        // P3 — never mock the versioning code under test (req 1.2, 1.3)
        // Promoted to 'error' by spec task 2.3: enabling them as 'warn' surfaced
        // 19 REAL placebo violations reachable by the scoped gate (2 vm-asserts,
        // 17 module mocks); all were fixed (real HTTP-boundary mocks + observable
        // assertions), so the bar is now hard. New violations break the build.
        'azion-architecture/no-internal-state-assert': 'error',
        'azion-architecture/no-versioning-module-mock': 'error'
      }
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
    // Reliability — applies repo-wide, not gated by tier.
    // navigator.clipboard.writeText() returns a Promise; ignoring it hides
    // permission rejections and lost-focus failures that silently break copy UX.
    'azion-architecture/no-unawaited-clipboard': 'error',
    'no-console': ['error', { allow: ['error'] }],
    'id-length': ['error', { min: 2 }]
  }
}
