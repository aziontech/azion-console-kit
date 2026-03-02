const path = require('path')
const { classifyPath } = require('../utils/path-classifier')
const { isStoreImport, isComposableImport, isDomImport, isTypeOnlyImport } = require('../utils/import-resolver')

const EXCLUDED_PATHS = [
  'base/http',
  'base/query',
  'axios/makeApi',
  'axios/errors'
]

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Services must only handle HTTP concerns. They should not import stores, composables, router, or access DOM.',
      category: 'Architecture - Layer Responsibility'
    },
    schema: [],
    messages: {
      noStoreInService:
        'Service "{{fileName}}" imports store "{{source}}". Services must only handle HTTP concerns.',
      noComposableInService:
        'Service "{{fileName}}" imports composable "{{source}}". Services must only handle HTTP concerns.',
      noDomInService:
        'Service "{{fileName}}" imports "{{source}}". Services must not access DOM or routing.',
      noDomAccess:
        'Service "{{fileName}}" accesses "{{object}}" directly. Services must not interact with the DOM.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const normalized = filename.replace(/\\/g, '/')
    const { role } = classifyPath(filename)

    if (role !== 'service') return {}
    if (EXCLUDED_PATHS.some((p) => normalized.includes(p))) return {}

    const fileName = path.basename(filename)

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        if (isTypeOnlyImport(source)) return

        if (isStoreImport(source)) {
          context.report({
            node,
            messageId: 'noStoreInService',
            data: { fileName, source }
          })
        }

        if (isComposableImport(source)) {
          context.report({
            node,
            messageId: 'noComposableInService',
            data: { fileName, source }
          })
        }

        if (isDomImport(source)) {
          context.report({
            node,
            messageId: 'noDomInService',
            data: { fileName, source }
          })
        }
      },

      MemberExpression(node) {
        const obj = node.object.name
        if (obj === 'document' || obj === 'localStorage' || obj === 'sessionStorage') {
          context.report({
            node,
            messageId: 'noDomAccess',
            data: { fileName, object: obj }
          })
        }
      }
    }
  }
}
