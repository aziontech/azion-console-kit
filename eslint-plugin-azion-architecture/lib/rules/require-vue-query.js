const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const { isServiceImport, isVueQueryImport } = require('../utils/import-resolver')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Composables that consume services must use Vue Query (useQuery/useMutation) for server state management.',
      category: 'Architecture - TanStack Performance Model'
    },
    schema: [],
    messages: {
      requireVueQuery:
        'Composable "{{fileName}}" imports service "{{source}}" but does not use Vue Query. Wrap server calls in useQuery/useMutation for automatic caching, deduplication, and error handling.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { role } = classifyPath(filename)

    // Only apply to composables
    if (role !== 'composable') return {}

    const fileName = path.basename(filename)
    let hasServiceImport = false
    let serviceSource = ''
    let hasVueQueryImport = false
    let hasBaseServiceUsage = false

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        if (isServiceImport(source)) {
          hasServiceImport = true
          serviceSource = source
        }

        if (isVueQueryImport(source)) {
          hasVueQueryImport = true
        }

        // BaseService already wraps Vue Query internally
        if (/BaseService|baseService|base-service/.test(source)) {
          hasBaseServiceUsage = true
        }
      },

      // Detect usage of classes that extend BaseService (they have useQuery/useMutation internally)
      MemberExpression(node) {
        if (
          node.property.name === 'useQuery' ||
          node.property.name === 'useMutation' ||
          node.property.name === 'useEnsureQueryData' ||
          node.property.name === 'usePrefetchQuery'
        ) {
          hasBaseServiceUsage = true
        }
      },

      // Check at the end of file
      'Program:exit'(node) {
        if (hasServiceImport && !hasVueQueryImport && !hasBaseServiceUsage) {
          // Find the service import node to report on
          const serviceImportNode = node.body.find(
            (n) => n.type === 'ImportDeclaration' && isServiceImport(n.source.value)
          )

          if (serviceImportNode) {
            context.report({
              node: serviceImportNode,
              messageId: 'requireVueQuery',
              data: { fileName, source: serviceSource }
            })
          }
        }
      }
    }
  }
}
