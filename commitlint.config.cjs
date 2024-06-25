/* eslint-disable no-undef */
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\[ENG-.*])?\s?(\w+):\s(.*)$/,
      headerCorrespondence: ['scope', 'type', 'subject'],
    },
  },
};

/**
 * Pattern:
 * [ENG-*] -> Scope is optional 
 * type -> Is required and needs to be one of [build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test]
 * subject -> Is required
 * 
 * See some valid examples:
 * [ENG-123] fix: typos in file Something.vue 
 * [ENG-321] styles: new theme.css file with nice changes 
 * feat: add a awesome create service
 * chore: some changes in router file
 *
 * 
*/
