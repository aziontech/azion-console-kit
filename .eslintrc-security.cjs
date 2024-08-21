/* eslint-env node */

module.exports = {
  root: true,
  extends: [
    'plugin:security/recommended-legacy',
    'plugin:xss/recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest'
  },
  plugins: ['no-unsanitized'],
  rules: {
    'no-unsanitized/method': 'error',
    'no-unsanitized/property': 'error',
  }
}
