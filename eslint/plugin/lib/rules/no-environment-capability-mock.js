/**
 * Anti-placebo (spec test-effectiveness, req 3 — the "webkit razor"): a test
 * must never FAKE an environment capability the runtime does not have.
 * jsdom cannot do layout, media queries, element observation or real focus —
 * stubbing ResizeObserver/matchMedia/IntersectionObserver/
 * getBoundingClientRect/focus makes the test pass while proving nothing.
 * If the test "needs" such a stub, it belongs in BROWSER MODE (functional
 * suite), where the capability is real.
 *
 * Restoring a REAL implementation (e.g. Node's BroadcastChannel from
 * node:worker_threads) is NOT a capability fake and is not matched here.
 */
const CAPABILITIES = new Set([
  'ResizeObserver',
  'matchMedia',
  'IntersectionObserver',
  'getBoundingClientRect',
  'focus'
])

const GLOBAL_OBJECTS = new Set(['window', 'global', 'globalThis'])

const MOCKING_CHAIN =
  /^mock(Implementation|ImplementationOnce|ResolvedValue|ResolvedValueOnce|ReturnValue|ReturnValueOnce)$/

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid faking environment capabilities (ResizeObserver, matchMedia, IntersectionObserver, getBoundingClientRect, focus) in tests — that capability only truly exists in browser mode. Move the test, do not fake the environment.',
      category: 'Testing - Anti-placebo'
    },
    schema: [],
    messages: {
      noCapabilityFake:
        'Do not fake "{{capability}}" in a test — jsdom/node cannot honor it, so the assertion proves nothing (silent no-op). This capability only truly exists in BROWSER MODE: move the test to src/tests/functional/, do not fake the environment.'
    }
  },

  create(context) {
    const report = (node, capability) =>
      context.report({ node, messageId: 'noCapabilityFake', data: { capability } })

    const capabilityFromLiteral = (node) =>
      node && node.type === 'Literal' && CAPABILITIES.has(node.value) ? node.value : null

    return {
      CallExpression(node) {
        const callee = node.callee
        if (callee.type !== 'MemberExpression' || callee.property.type !== 'Identifier') return

        // vi.stubGlobal('<capability>', …)
        if (
          callee.object.type === 'Identifier' &&
          callee.object.name === 'vi' &&
          callee.property.name === 'stubGlobal'
        ) {
          const capability = capabilityFromLiteral(node.arguments[0])
          if (capability) report(node.arguments[0], capability)
          return
        }

        // Object.defineProperty(window|global|globalThis, '<capability>', …)
        if (
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Object' &&
          callee.property.name === 'defineProperty' &&
          node.arguments[0]?.type === 'Identifier' &&
          GLOBAL_OBJECTS.has(node.arguments[0].name)
        ) {
          const capability = capabilityFromLiteral(node.arguments[1])
          if (capability) report(node.arguments[1], capability)
          return
        }

        // vi.spyOn(<anything>, 'getBoundingClientRect'|'focus').mock*(…)
        if (
          callee.object.type === 'Identifier' &&
          callee.object.name === 'vi' &&
          callee.property.name === 'spyOn'
        ) {
          const capability = capabilityFromLiteral(node.arguments[1])
          const chain = node.parent
          const replacesBehavior =
            chain?.type === 'MemberExpression' &&
            chain.property?.type === 'Identifier' &&
            MOCKING_CHAIN.test(chain.property.name)
          if (capability && replacesBehavior) report(node.arguments[1], capability)
        }
      },

      // window.matchMedia = vi.fn()  /  global.ResizeObserver = class {}
      AssignmentExpression(node) {
        const target = node.left
        if (
          target.type === 'MemberExpression' &&
          target.object.type === 'Identifier' &&
          GLOBAL_OBJECTS.has(target.object.name) &&
          target.property.type === 'Identifier' &&
          CAPABILITIES.has(target.property.name)
        ) {
          report(target, target.property.name)
        }
      }
    }
  }
}
