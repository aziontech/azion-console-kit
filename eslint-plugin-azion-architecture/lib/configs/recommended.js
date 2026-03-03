/**
 * Recommended config.
 *
 * Performance (TanStack): error — mandatory
 * Best practices: warn — encourage but don't block
 * Architecture: off — disabled
 */
module.exports = {
  plugins: ['azion-architecture'],
  rules: {
    // Performance — TanStack Vue Query integration is required
    'azion-architecture/no-direct-http-in-components': 'error',
    'azion-architecture/no-http-in-stores': 'error',
    'azion-architecture/require-vue-query': 'error',

    // Best practices — encourage clean layer separation
    'azion-architecture/no-try-catch-in-services': 'warn',
    'azion-architecture/services-http-only': 'warn',
    'azion-architecture/pure-adapters': 'warn',
    'azion-architecture/no-http-in-adapters': 'warn',

    // Architecture — disabled
    'azion-architecture/module-isolation': 'off',
    'azion-architecture/naming-convention': 'off',
    'azion-architecture/type-separation': 'off'
  }
}
