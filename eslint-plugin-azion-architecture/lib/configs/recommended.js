/**
 * Recommended config with all rules enabled.
 * Severity is controlled via ESLint overrides in .eslintrc.cjs per directory zone.
 */
module.exports = {
  plugins: ['azion-architecture'],
  rules: {
    // Stage 1 — TanStack Performance Model
    'azion-architecture/no-direct-http-in-components': 'warn',
    'azion-architecture/no-http-in-stores': 'warn',
    'azion-architecture/require-vue-query': 'warn',

    // Stage 2 — Layer Responsibility
    'azion-architecture/no-try-catch-in-services': 'warn',
    'azion-architecture/services-http-only': 'warn',
    'azion-architecture/pure-adapters': 'warn',
    'azion-architecture/no-http-in-adapters': 'warn',

    // Stage 3 — Boundaries & Structure
    'azion-architecture/module-isolation': 'warn',
    'azion-architecture/naming-convention': 'warn',
    'azion-architecture/type-separation': 'warn'
  }
}
