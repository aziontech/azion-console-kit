/**
 * Anti-placebo (P2, spec versioning-test-coverage req 1.1/1.7): assertions must
 * target observable behavior — emitted events, rendered DOM/ARIA, returned
 * values — never a component's internal state or its class strings. Asserting
 * `wrapper.vm.*` or `wrapper.classes()` couples the test to one implementation
 * (a refactor trap) without proving user-visible behavior.
 */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid expect() on internal component state (.vm.*) or class-string lists (.classes()). Assert observable behavior instead. See .claude/rules/testing-versioning.md.',
      category: 'Testing - Anti-placebo'
    },
    schema: [],
    messages: {
      noVmAssert:
        'Do not assert internal component state (`.vm.…`) — assert observable behavior: emitted events, DOM text, attributes, ARIA.',
      noClassesAssert:
        'Do not assert class-string lists (`.classes()`) — classes are implementation detail. Assert `data-*` attributes, ARIA or visible state instead.'
    }
  },

  create(context) {
    const containsVmAccess = (node, depth = 0) => {
      if (!node || depth > 6) return false
      if (node.type === 'MemberExpression') {
        if (node.property.type === 'Identifier' && node.property.name === 'vm') return true
        return containsVmAccess(node.object, depth + 1)
      }
      if (node.type === 'CallExpression') return containsVmAccess(node.callee, depth + 1)
      return false
    }

    const containsClassesCall = (node, depth = 0) => {
      if (!node || depth > 6) return false
      if (node.type === 'CallExpression') {
        const callee = node.callee
        if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'classes'
        ) {
          return true
        }
        return containsClassesCall(callee, depth + 1)
      }
      if (node.type === 'MemberExpression') return containsClassesCall(node.object, depth + 1)
      return false
    }

    return {
      CallExpression(node) {
        const isExpect = node.callee.type === 'Identifier' && node.callee.name === 'expect'
        if (!isExpect || node.arguments.length === 0) return

        const [subject] = node.arguments
        if (containsVmAccess(subject)) {
          context.report({ node: subject, messageId: 'noVmAssert' })
          return
        }
        if (containsClassesCall(subject)) {
          context.report({ node: subject, messageId: 'noClassesAssert' })
        }
      }
    }
  }
}
