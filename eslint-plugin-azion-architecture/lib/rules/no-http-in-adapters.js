const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const { isHttpImport } = require('../utils/import-resolver')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Adapters must not make HTTP calls. They are pure data transformation functions.',
      category: 'Architecture - Layer Responsibility'
    },
    schema: [],
    messages: {
      noHttpInAdapter:
        'Adapter "{{fileName}}" imports HTTP module "{{source}}". Adapters must only transform data (API ↔ App), not make HTTP calls.',
      noFetchInAdapter:
        'Adapter "{{fileName}}" calls fetch() directly. Adapters must not make HTTP calls.',
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

        if (isHttpImport(source)) {
          context.report({
            node,
            messageId: 'noHttpInAdapter',
            data: { fileName, source }
          })
        }
      },

      CallExpression(node) {
        // Detect fetch()
        if (node.callee.name === 'fetch') {
          context.report({
            node,
            messageId: 'noFetchInAdapter',
            data: { fileName }
          })
        }

        // Detect this.http.request(), this.http.get(), etc.
        if (
          node.callee.type === 'MemberExpression' &&
          node.callee.object.type === 'MemberExpression' &&
          node.callee.object.property.name === 'http'
        ) {
          context.report({
            node,
            messageId: 'noHttpMethod',
            data: { fileName, method: node.callee.property.name }
          })
        }
      }
    }
  }
}
