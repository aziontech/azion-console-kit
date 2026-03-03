const path = require('path')
const { classifyPath } = require('../utils/path-classifier')

const CONVENTIONS = {
  service: {
    pattern: /^[a-z][a-z0-9-]*-service\.(js|ts)$/,
    expected: '<name>-service.js/ts'
  },
  adapter: {
    pattern: /^[a-z][a-z0-9-]*-adapter\.(js|ts)$/,
    expected: '<name>-adapter.js/ts'
  },
  composable: {
    pattern: /^use[-A-Z][a-zA-Z0-9-]*\.(js|ts)$/,
    expected: 'use-<name>.js/ts or use<Name>.js/ts'
  },
  store: {
    pattern: /^[a-z][a-z0-9-]*-store\.(js|ts)$/,
    expected: '<name>-store.js/ts'
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Files must follow naming conventions: *-service.js/ts, *-adapter.js/ts, use*.js/ts, *-store.js/ts.',
      category: 'Architecture - Structure'
    },
    schema: [],
    messages: {
      invalidName:
        'File "{{fileName}}" in {{roleDir}} does not follow naming convention. Expected: {{expected}}.'
    }
  },

  create(context) {
    const filename = context.getFilename()
    const { zone, role } = classifyPath(filename)

    // Only apply to modules and v2 services
    if (zone !== 'module' && zone !== 'v2-service') return {}

    const fileName = path.basename(filename)

    // Skip non-JS/TS files (like .vue — they have their own patterns)
    if (!/\.(js|ts)$/.test(fileName)) return {}

    // Skip index files
    if (/^index\.(js|ts)$/.test(fileName)) return {}

    // Skip type/contract files
    if (/\.(types|contracts)\.(js|ts)$/.test(fileName)) return {}

    // Skip test files
    if (/\.(test|spec)\.(js|ts)$/.test(fileName)) return {}

    const convention = CONVENTIONS[role]
    if (!convention) return {}

    return {
      Program(node) {
        if (!convention.pattern.test(fileName)) {
          const roleDirMap = {
            service: 'services/',
            adapter: 'adapters/',
            composable: 'composables/',
            store: 'stores/'
          }

          context.report({
            node,
            messageId: 'invalidName',
            data: {
              fileName,
              roleDir: roleDirMap[role] || role,
              expected: convention.expected
            }
          })
        }
      }
    }
  }
}
