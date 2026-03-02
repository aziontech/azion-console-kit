const path = require('path')
const { classifyPath } = require('../utils/path-classifier')

// Base infrastructure services that legitimately need try/catch
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
        'Services must not use try/catch. Let errors propagate to Vue Query for centralized error handling.',
      category: 'Architecture - Layer Responsibility'
    },
    schema: [],
    messages: {
      noTryCatch:
        'Service "{{fileName}}" uses try/catch. Services should let errors propagate — Vue Query handles errors via onError callbacks.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const normalized = filename.replace(/\\/g, '/')
    const { role } = classifyPath(filename)

    // Only apply to service files
    if (role !== 'service') return {}

    // Exclude base infrastructure services
    if (EXCLUDED_PATHS.some((p) => normalized.includes(p))) return {}

    const fileName = path.basename(filename)

    return {
      TryStatement(node) {
        context.report({
          node,
          messageId: 'noTryCatch',
          data: { fileName }
        })
      }
    }
  }
}
