const path = require('path')
const { classifyPath } = require('../utils/path-classifier')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'API types (.types.ts) must not be mixed with app contracts (.contracts.ts) in the same file.',
      category: 'Architecture - Structure'
    },
    schema: [],
    messages: {
      typesInContracts:
        'Contract file "{{fileName}}" imports from a .types file. Contracts should define app-layer types independently. If you need API types, transform them in the adapter.',
      contractsInTypes:
        'Types file "{{fileName}}" imports from a .contracts file. API types (.types.ts) should be standalone definitions that mirror the API response shape.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { zone } = classifyPath(filename)

    // Only apply to modules and v2 services
    if (zone !== 'module' && zone !== 'v2-service') return {}

    const fileName = path.basename(filename)
    const isTypesFile = /\.types\.(js|ts)$/.test(fileName)
    const isContractsFile = /\.contracts\.(js|ts)$/.test(fileName)

    // Only apply to type and contract files
    if (!isTypesFile && !isContractsFile) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        if (isContractsFile && /\.types(\.(js|ts))?$/.test(source)) {
          context.report({
            node,
            messageId: 'typesInContracts',
            data: { fileName }
          })
        }

        if (isTypesFile && /\.contracts(\.(js|ts))?$/.test(source)) {
          context.report({
            node,
            messageId: 'contractsInTypes',
            data: { fileName }
          })
        }
      }
    }
  }
}
