const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const { isHttpOrServiceImport, isTypeOnlyImport, isFetchCall } = require('../utils/import-resolver')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Pinia stores must not fetch server data. Stores are for client state only.',
      category: 'Architecture - TanStack Performance Model'
    },
    schema: [],
    messages: {
      noHttpInStore:
        'Store "{{fileName}}" imports "{{source}}". Pinia stores must contain only client state. Server data must be managed via Vue Query composables.',
      noFetchInStore:
        'Store "{{fileName}}" calls fetch() directly. Stores must not make HTTP calls.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { role } = classifyPath(filename)

    // Apply to files identified as stores by path
    if (role !== 'store') return {}

    const fileName = path.basename(filename)

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        // Allow type/contract imports
        if (isTypeOnlyImport(source)) return

        if (isHttpOrServiceImport(source)) {
          context.report({
            node,
            messageId: 'noHttpInStore',
            data: { fileName, source }
          })
        }
      },

      CallExpression(node) {
        if (isFetchCall(node)) {
          context.report({
            node,
            messageId: 'noFetchInStore',
            data: { fileName }
          })
        }
      }
    }
  }
}
