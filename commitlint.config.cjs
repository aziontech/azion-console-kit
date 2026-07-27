/* eslint-disable no-undef */
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [0]
  },
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\[[A-Z]+-.*])?\s?(\w+):\s(.*)$/, // eslint-disable-line
      headerCorrespondence: ['scope', 'type', 'subject']
    }
  }
}

/**
 * Pattern:
 * [ABC-123] -> Issue-tracker scope is optional
 * type -> Is required and needs to be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]
 * subject -> Is required
 *
 * See some valid examples:
 * [ABC-123] fix: typos in file Something.vue
 * feat: add a awesome create service
 * chore: some changes in router file
 */
