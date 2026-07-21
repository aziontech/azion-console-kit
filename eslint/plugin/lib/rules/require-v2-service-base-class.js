const path = require('path')
const { classifyPath } = require('../utils/path-classifier')

// Superclasses that make a service BaseService-backed. VersionServiceBase itself
// extends BaseService. Add new BaseService-derived bases here as they appear.
const VALID_BASE_CLASSES = new Set(['BaseService', 'VersionServiceBase'])

const SERVICE_FILE = /-service\.(js|ts)$/
const TEST_FILE = /\.(test|spec|pbt)\.(js|ts)$/

function isTopLevel(node) {
  const parent = node.parent
  if (!parent) return false
  if (parent.type === 'Program') return true
  return (
    (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration') &&
    parent.parent &&
    parent.parent.type === 'Program'
  )
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'V2 service classes must extend BaseService (or a BaseService-derived base). Components and composables are exempted from no-direct-http-in-components/require-vue-query for @/services/v2 imports on the assumption these services are BaseService-backed.',
      category: 'Architecture - TanStack Performance Model'
    },
    schema: [],
    messages: {
      mustExtendBaseService:
        'Service class "{{className}}" in "{{fileName}}" must extend BaseService (or VersionServiceBase). V2 services are exempted from require-vue-query and no-direct-http-in-components on the assumption they are BaseService-backed; a service that does not extend BaseService bypasses the TanStack performance model.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const normalized = filename.replace(/\\/g, '/')
    const { zone } = classifyPath(filename)

    if (zone !== 'v2-service') return {}

    const fileName = path.basename(filename)
    if (!SERVICE_FILE.test(fileName)) return {}
    if (TEST_FILE.test(fileName)) return {}
    if (normalized.includes('/services/v2/base/')) return {}

    function checkClass(node) {
      if (!isTopLevel(node)) return

      const className = node.id && node.id.name
      if (!className || !/Service$/.test(className)) return

      const superName = node.superClass && node.superClass.name
      if (!superName || !VALID_BASE_CLASSES.has(superName)) {
        context.report({
          node: node.superClass || node.id || node,
          messageId: 'mustExtendBaseService',
          data: { className, fileName }
        })
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass
    }
  }
}
