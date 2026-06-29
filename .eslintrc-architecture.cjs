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
  rules: {
    // no-io-in-components (spec new-release-data-layer, Property 2; req 9.2, 10.2):
    // forbid axios/*-service imports and the service-to-service endpoint literals
    // (workloadsByDeployment, edge/api/graphql) inside any src/**/components/ file.
    // The rule self-scopes by path, so declaring it repo-wide is safe. Starts as
    // 'warn'; promoted to 'error' in Fase 5 (task 14.1).
    'azion-architecture/no-io-in-components': 'warn'
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
        'src/composables/**/*',
        // new-release-screen feature (spec new-release-screen, Property 3):
        // the canonical, surface-agnostic composition module. path-classifier
        // classifies its .vue as components and use-* as composables, so the
        // no-direct-http-in-components / require-vue-query / services-http-only
        // guards apply here. The feature-path override below promotes them to
        // error; this legacy default stays warn for the rest of the repo.
        'src/templates/release-composition/**/*'
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
    },
    {
      // new-release-screen feature paths (spec new-release-screen, task 15.1).
      // The refactor is complete: HTTP dispatch lives in the composable, the
      // store is service-free and exposes only a pure composePayload(). The
      // architecture guards are now BUILD-BREAKERS on these paths (promoted from
      // the legacy warn above — this later, more-specific override wins, and the
      // promotion stays scoped to the feature, never repo-wide).
      //
      // EXCEPTION: `require-vue-query` stays `warn` on the composable. It imports
      // the resource-catalog-registry for on-demand (non-vue-query) catalog/version
      // loads — the exact accepted treatment of the sibling `use-deploy-drawer.js`.
      files: [
        'src/stores/release.js',
        'src/views/Deployments/v6/**/*.{vue,js}',
        'src/templates/release-composition/**/*.{vue,js}'
      ],
      rules: {
        'azion-architecture/no-direct-http-in-components': 'error',
        'azion-architecture/no-http-in-stores': 'error',
        'azion-architecture/require-vue-query': 'warn',
        'azion-architecture/services-http-only': 'error',
        'azion-architecture/pure-adapters': 'error',
        'azion-architecture/no-try-catch-in-services': 'warn',
        'azion-architecture/module-isolation': 'off',
        'azion-architecture/naming-convention': 'off',
        'azion-architecture/type-separation': 'off'
      }
    }
  ]
}
