/**
* 'off' or 0 - disable the rule completely
* 'warn' or 1 - show as warning (doesn't fail build)
* 'error' or 2 - show as error (fails build)
**/

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
  plugins: ['no-unsanitized', 'regexp'],
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
    'security/detect-object-injection': 0,
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    'security/detect-unsafe-regex': 'error',
    
    'regexp/no-super-linear-backtracking': 'error',
    'regexp/no-misleading-unicode-character': 'error',
    'regexp/no-obscure-range': 'error',
    'regexp/no-control-character': 'error',
    'regexp/strict': 'error'
  }
}
