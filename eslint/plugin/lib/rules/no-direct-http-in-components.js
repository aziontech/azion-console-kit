const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const {
  isHttpOrServiceImport,
  isTypeOnlyImport,
  isErrorImport,
  isV2ServiceImport
} = require('../utils/import-resolver')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Components must not make HTTP calls directly. Use composables with Vue Query instead.',
      category: 'Architecture - TanStack Performance Model'
    },
    schema: [],
    messages: {
      noDirectHttp:
        'Component "{{fileName}}" imports "{{source}}" directly. HTTP calls must go through composables using Vue Query (useQuery/useMutation).',
      noFetchCall:
        'Component "{{fileName}}" calls fetch() directly. Use a composable with Vue Query instead.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { role } = classifyPath(filename)

    // Only apply to components (.vue files, files in components/ or views/)
    if (role !== 'component') return {}

    const fileName = path.basename(filename)

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        // Allow type/contract imports everywhere
        if (isTypeOnlyImport(source)) return
        // Allow error imports (error types, error handlers)
        if (isErrorImport(source)) return
        // Allow v2 service imports — they extend BaseService and expose
        // Vue Query methods (.useQuery, .useMutation), so components can
        // safely call service.useListXxx() without a separate composable.
        if (isV2ServiceImport(source)) return

        if (isHttpOrServiceImport(source)) {
          context.report({
            node,
            messageId: 'noDirectHttp',
            data: { fileName, source }
          })
        }
      },

      CallExpression(node) {
        // Detect fetch() or window.fetch()
        const isFetch =
          node.callee.name === 'fetch' ||
          (node.callee.type === 'MemberExpression' &&
            node.callee.object.name === 'window' &&
            node.callee.property.name === 'fetch')

        if (isFetch) {
          context.report({
            node,
            messageId: 'noFetchCall',
            data: { fileName }
          })
        }
      }
    }
  }
}
