/**
 * Anti-placebo (P3, spec versioning-test-coverage req 1.2/1.3): a test must
 * never mock the versioning code under test. Mocks may only stand in for
 * boundaries EXTERNAL to the versioning logic (HTTP client, router, toast,
 * storage, clock). Mocking the machine/bus/adapters/composables produces a
 * test that asserts the mock, not the behavior — a placebo.
 */
const VERSIONING_MODULE_PATTERN =
  /composables\/versioning\/|templates\/version-shell-block|services\/v2\/versioning\/|version-machine|version-capability|version-actions|version-adapter|version-service|use-version-/

// vi.spyOn(<versioningService>, 'method').mockImplementation(...) is the same
// placebo through a different door (found evading this rule in the 2026-07-23
// deep review). Heuristic: the spied identifier is a versioning service
// singleton (contains "version"/"versioned" AND ends in Service).
const VERSIONING_IDENTIFIER_PATTERN = /(version|Version).*Service$|^versioned/
const MOCKING_CHAIN =
  /^mock(Implementation|ImplementationOnce|ResolvedValue|ResolvedValueOnce|RejectedValue|RejectedValueOnce|ReturnValue|ReturnValueOnce)$/

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid vi.mock()/vi.doMock() of versioning modules and vi.spyOn(versioningService).mock*() replacements — mock only external boundaries (HTTP, router, toast). See .claude/rules/testing-versioning.md.',
      category: 'Testing - Anti-placebo'
    },
    schema: [],
    messages: {
      noMockUnderTest:
        'Do not mock the versioning module "{{source}}" — that mocks the code under test (placebo). Mock only external boundaries: HTTP client (AxiosHttpClientAdapter/httpService), vue-router, toast, storage.',
      noSpyReplaceUnderTest:
        'Do not replace versioning-service behavior via vi.spyOn({{source}}, …).{{chain}}() — same placebo as vi.mock through a different door. Stub the HTTP boundary (spyHttpRequest) instead; bare spyOn (observation only) is fine.'
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

        const isViSpyOn =
          callee.type === 'MemberExpression' &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'vi' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'spyOn'

        if (isViSpyOn) {
          const [target] = node.arguments
          const chain = node.parent
          const isBehaviorReplacement =
            chain?.type === 'MemberExpression' &&
            chain.property?.type === 'Identifier' &&
            MOCKING_CHAIN.test(chain.property.name)
          if (
            isBehaviorReplacement &&
            target?.type === 'Identifier' &&
            VERSIONING_IDENTIFIER_PATTERN.test(target.name)
          ) {
            context.report({
              node: target,
              messageId: 'noSpyReplaceUnderTest',
              data: { source: target.name, chain: chain.property.name }
            })
          }
          return
        }

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
