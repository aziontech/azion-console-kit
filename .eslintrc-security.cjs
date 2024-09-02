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
    'security/detect-bidi-characters': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-new-buffer': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-object-injection': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error'
  }
}
