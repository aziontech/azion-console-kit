/**
 * Anti-placebo (P3, spec versioning-test-coverage req 1.2/1.3): a test must
 * never mock the versioning code under test. Mocks may only stand in for
 * boundaries EXTERNAL to the versioning logic (HTTP client, router, toast,
 * storage, clock). Mocking the machine/bus/adapters/composables produces a
 * test that asserts the mock, not the behavior — a placebo.
 */
const VERSIONING_MODULE_PATTERN =
  /composables\/versioning\/|templates\/version-shell-block|services\/v2\/versioning\/|version-machine|version-capability|version-actions|version-adapter|version-service|use-version-/

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid vi.mock()/vi.doMock() of versioning modules — mock only external boundaries (HTTP, router, toast). See .claude/rules/testing-versioning.md.',
      category: 'Testing - Anti-placebo'
    },
    schema: [],
    messages: {
      noMockUnderTest:
        'Do not mock the versioning module "{{source}}" — that mocks the code under test (placebo). Mock only external boundaries: HTTP client (AxiosHttpClientAdapter/httpService), vue-router, toast, storage.'
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee
        const isViMock =
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'vi' &&
          callee.property.type === 'Identifier' &&
          ['mock', 'doMock'].includes(callee.property.name)

        if (!isViMock) return

        const [firstArg] = node.arguments
        if (!firstArg || firstArg.type !== 'Literal' || typeof firstArg.value !== 'string') return

        if (VERSIONING_MODULE_PATTERN.test(firstArg.value)) {
          context.report({
            node: firstArg,
            messageId: 'noMockUnderTest',
            data: { source: firstArg.value }
          })
        }
      }
    }
  }
}
