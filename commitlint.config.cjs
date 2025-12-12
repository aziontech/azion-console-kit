/* eslint-disable no-undef */
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\[ENG-.*|UXE-.*|NO-ISSUE])?\s?(\w+):\s(.*)$/,
      headerCorrespondence: ['scope', 'type', 'subject'],
    }
  },
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "hotfix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test"
      ]
    ]
  }
}

/**
 * Pattern:
 * [ENG-*] -> Scope is optional 
 * type -> Is required and needs to be one of [build, chore, ci, docs, feat, fix, hotfix, perf, refactor, revert, style, test]
 * subject -> Is requiredf
 * 
 * See some valid examples:
 * [ENG-123] fix: typos in file Something.vue 
 * [ENG-321] styles: new theme.css file with nice changes 
 * feat: add a awesome create service
 * chore: some changes in router file
 *
 * 
*/
