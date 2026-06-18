/**
 * no-unawaited-clipboard
 *
 * Forbids `navigator.clipboard.writeText(...)` (and `readText`) calls that
 * are neither awaited nor otherwise consumed as a Promise.
 *
 * Rationale
 * ─────────
 * `navigator.clipboard.writeText` returns a Promise that rejects on permission
 * errors, on writes from non-secure contexts, and when the document loses
 * focus mid-call. Fire-and-forget calls swallow these errors silently and
 * produce sporadic, hard-to-debug UX (e.g. "Copied!" toast shown when the
 * clipboard write actually failed).
 *
 * Accepted shapes
 * ───────────────
 *   await navigator.clipboard.writeText(text)
 *   return navigator.clipboard.writeText(text)
 *   navigator.clipboard.writeText(text).then(...)
 *   navigator.clipboard.writeText(text).catch(...)
 *   navigator.clipboard.writeText(text).finally(...)
 *   void navigator.clipboard.writeText(text)              // explicit opt-out
 *   const p = navigator.clipboard.writeText(text)         // result captured
 *   Promise.all([navigator.clipboard.writeText(text)])    // composed
 *
 * Rejected shape
 * ──────────────
 *   navigator.clipboard.writeText(text)                   // fire-and-forget
 */

const PROMISE_CHAIN_METHODS = new Set(['then', 'catch', 'finally'])
const PROMISE_COMBINATORS = new Set(['all', 'allSettled', 'race', 'any'])

/**
 * Returns true when `node` is a MemberExpression chain that terminates with
 * `.clipboard.<methodName>` — independent of how the chain begins. This
 * matches `navigator.clipboard.writeText` and `window.navigator.clipboard.writeText`,
 * but does not match unrelated identifiers named `clipboard`.
 */
function isNavigatorClipboardMethod(callee, methodName) {
  if (!callee || callee.type !== 'MemberExpression') return false
  if (callee.computed) return false
  if (callee.property.type !== 'Identifier') return false
  if (callee.property.name !== methodName) return false

  const object = callee.object
  if (!object || object.type !== 'MemberExpression') return false
  if (object.computed) return false
  if (object.property.type !== 'Identifier') return false
  if (object.property.name !== 'clipboard') return false

  // Look for an identifier named `navigator` somewhere in the receiver chain.
  // Matches both `navigator.clipboard.x` and `window.navigator.clipboard.x`.
  let cursor = object.object
  while (cursor) {
    if (cursor.type === 'Identifier') {
      return cursor.name === 'navigator'
    }
    if (cursor.type !== 'MemberExpression') return false
    if (
      !cursor.computed &&
      cursor.property.type === 'Identifier' &&
      cursor.property.name === 'navigator'
    ) {
      return true
    }
    cursor = cursor.object
  }
  return false
}

/**
 * Returns true if the call expression is consumed in a way that the returned
 * Promise can be observed (awaited, returned, chained, void-marked, stored,
 * or composed via Promise combinators).
 */
function isPromiseConsumed(node) {
  const parent = node.parent
  if (!parent) return false

  switch (parent.type) {
    case 'AwaitExpression':
      return true

    case 'ReturnStatement':
    case 'ArrowFunctionExpression':
      return true

    case 'UnaryExpression':
      // `void navigator.clipboard.writeText(...)` is an explicit opt-out.
      return parent.operator === 'void'

    case 'VariableDeclarator':
      return parent.init === node

    case 'AssignmentExpression':
      return parent.right === node

    case 'Property':
      // Stored in an object literal — caller will consume it.
      return parent.value === node

    case 'ArrayExpression':
      // Likely part of Promise.all([...]) or similar composition.
      return true

    case 'YieldStatement':
    case 'YieldExpression':
      return true

    case 'ConditionalExpression':
      // Result of a conditional is consumed by whatever holds the conditional.
      return isPromiseConsumed(parent)

    case 'LogicalExpression':
      // Same — propagates upward.
      return isPromiseConsumed(parent)

    case 'MemberExpression': {
      // `.then`/`.catch`/`.finally` chains.
      if (
        parent.object === node &&
        !parent.computed &&
        parent.property.type === 'Identifier' &&
        PROMISE_CHAIN_METHODS.has(parent.property.name)
      ) {
        return true
      }
      return false
    }

    case 'CallExpression': {
      // Passed as an argument to a Promise combinator (`Promise.all(...)` etc.).
      if (parent.arguments.includes(node)) {
        const callee = parent.callee
        if (
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          callee.object.name === 'Promise' &&
          callee.property.type === 'Identifier' &&
          PROMISE_COMBINATORS.has(callee.property.name)
        ) {
          return true
        }
        // Any other call passing the promise as an argument also "consumes" it.
        return true
      }
      return false
    }

    default:
      return false
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'navigator.clipboard.writeText() must be awaited or its returned Promise otherwise consumed.',
      category: 'Reliability'
    },
    schema: [],
    messages: {
      clipboardWriteTextNotAwaited:
        'navigator.clipboard.writeText() must be awaited. ' +
        'It returns a Promise that rejects on permission errors and lost-focus conditions; ' +
        'ignoring the rejection silently breaks copy UX. ' +
        'Use `await navigator.clipboard.writeText(...)`, chain `.then().catch()`, or mark it `void` if intentional.',
      clipboardReadTextNotAwaited:
        'navigator.clipboard.readText() must be awaited. ' +
        'It returns a Promise; ignoring it discards the read value and any permission rejection.'
    }
  },

  create(context) {
    return {
      CallExpression(node) {
        if (isNavigatorClipboardMethod(node.callee, 'writeText')) {
          if (!isPromiseConsumed(node)) {
            context.report({
              node,
              messageId: 'clipboardWriteTextNotAwaited'
            })
          }
          return
        }

        if (isNavigatorClipboardMethod(node.callee, 'readText')) {
          if (!isPromiseConsumed(node)) {
            context.report({
              node,
              messageId: 'clipboardReadTextNotAwaited'
            })
          }
        }
      }
    }
  }
}
