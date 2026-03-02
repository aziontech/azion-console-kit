const path = require('path')
const { classifyPath, getModuleFromImport } = require('../utils/path-classifier')

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Modules must not import from other modules. Use shared layers (@/components, @/stores, @/composables) instead.',
      category: 'Architecture - Boundaries'
    },
    schema: [],
    messages: {
      noModuleCrossImport:
        'Module "{{currentModule}}" imports from module "{{importedModule}}" via "{{source}}". Modules must be isolated. Extract shared code to @/components, @/stores, or @/composables.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { zone, moduleName } = classifyPath(filename)

    // Only apply to files inside modules
    if (zone !== 'module' || !moduleName) return {}

    return {
      ImportDeclaration(node) {
        const source = node.source.value
        const importedModule = getModuleFromImport(source)

        // If importing from a different module, report
        if (importedModule && importedModule !== moduleName) {
          context.report({
            node,
            messageId: 'noModuleCrossImport',
            data: {
              currentModule: moduleName,
              importedModule,
              source
            }
          })
        }
      }
    }
  }
}
