const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const { isHttpOrServiceImport, isTypeOnlyImport, isFetchCall } = require('../utils/import-resolver')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Adapters must be pure functions without side effects. No console, localStorage, HTTP, or DOM access.',
      category: 'Architecture - Layer Responsibility'
    },
    schema: [],
    messages: {
      noSideEffects:
        'Adapter "{{fileName}}" has side effect: {{detail}}. Adapters must be pure transformation functions (API ↔ App).',
      noHttpImport:
        'Adapter "{{fileName}}" imports HTTP module "{{source}}". Adapters must not make HTTP calls.',
      noHttpMethod:
        'Adapter "{{fileName}}" calls this.http.{{method}}(). Adapters must not make HTTP calls.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { role } = classifyPath(filename)

    if (role !== 'adapter') return {}

    const fileName = path.basename(filename)

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        if (isTypeOnlyImport(source)) return

        if (isHttpOrServiceImport(source)) {
          context.report({
            node,
            messageId: 'noHttpImport',
            data: { fileName, source }
          })
        }
      },

      CallExpression(node) {
        // Detect fetch() or window.fetch()
        if (isFetchCall(node)) {
          context.report({
            node,
            messageId: 'noSideEffects',
            data: { fileName, detail: 'calls fetch()' }
          })
          return
        }

        // Detect console.*, localStorage.*, sessionStorage.*
        if (node.callee.type === 'MemberExpression') {
          const obj = node.callee.object.name
          const prop = node.callee.property.name

          if (obj === 'console') {
            context.report({
              node,
              messageId: 'noSideEffects',
              data: { fileName, detail: `calls console.${prop}()` }
            })
          }

          if (obj === 'localStorage' || obj === 'sessionStorage') {
            context.report({
              node,
              messageId: 'noSideEffects',
              data: { fileName, detail: `accesses ${obj}.${prop}()` }
            })
          }
        }
      },

      MemberExpression(node) {
        // Detect window.* or document.* access (read, not just calls)
        const obj = node.object.name
        if (obj === 'document') {
          context.report({
            node,
            messageId: 'noSideEffects',
            data: { fileName, detail: `accesses document.${node.property.name}` }
          })
        }

        // Detect this.http.get(), this.http.post(), etc.
        if (
          node.parent.type === 'CallExpression' &&
          node.parent.callee === node &&
          node.object.type === 'MemberExpression' &&
          node.object.property.name === 'http'
        ) {
          context.report({
            node,
            messageId: 'noHttpMethod',
            data: { fileName, method: node.property.name }
          })
        }
      }
    }
  }
}
