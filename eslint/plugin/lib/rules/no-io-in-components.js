const path = require('path')
const { isHttpOrServiceImport, isTypeOnlyImport } = require('../utils/import-resolver')

// Service-to-service endpoint markers that must never appear inside a component.
// The s2s GraphQL path (`workloadsByDeployment` query / `edge/api/graphql` endpoint)
// is 404 to tenant auth and is explicitly excluded from the browser-reachable flow
// (spec new-release-data-layer, Property 2; requirements 9.2, 10.2).
const FORBIDDEN_S2S_LITERALS = ['workloadsByDeployment', 'edge/api/graphql']

/**
 * Matches files that live under any `components/` directory inside `src/`,
 * e.g. `src/components/...`, `src/modules/<m>/components/...`,
 * `src/templates/release-composition/components/...`. Handles both absolute
 * paths (from a real lint run) and repo-relative paths (from RuleTester).
 */
function isUnderComponentsDir(filePath) {
  const segments = filePath.replace(/\\/g, '/').split('/')
  const srcIndex = segments.indexOf('src')
  // A `components` directory must appear at or below `src/` (path-segment check
  // instead of a regex to avoid ReDoS-prone backtracking).
  return srcIndex !== -1 && segments.indexOf('components', srcIndex + 1) !== -1
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Components must not perform IO: no axios/*-service imports and no service-to-service endpoint literals (workloadsByDeployment, edge/api/graphql).',
      category: 'Architecture - TanStack Performance Model'
    },
    schema: [],
    messages: {
      noIoImport:
        'Component "{{fileName}}" imports "{{source}}" directly. IO must go through composables/services, not components.',
      noS2sLiteral:
        'Component "{{fileName}}" references the service-to-service endpoint "{{literal}}". This path is not browser-reachable; use the tenant-scoped services instead.'
    }
  },

  create(context) {
    const filename = context.getFilename()

    // Only apply to files under a components/ directory.
    if (!isUnderComponentsDir(filename)) return {}

    const fileName = path.basename(filename)

    function reportForbiddenLiteral(node, value) {
      if (typeof value !== 'string') return
      for (const literal of FORBIDDEN_S2S_LITERALS) {
        if (value.includes(literal)) {
          context.report({
            node,
            messageId: 'noS2sLiteral',
            data: { fileName, literal }
          })
          return
        }
      }
    }

    return {
      ImportDeclaration(node) {
        const source = node.source.value

        // Allow type/contract imports (no runtime IO).
        if (isTypeOnlyImport(source)) return

        // (a) axios or any *-service module.
        if (isHttpOrServiceImport(source)) {
          context.report({
            node,
            messageId: 'noIoImport',
            data: { fileName, source }
          })
        }
      },

      // (b) string literals referencing the s2s endpoint, anywhere in the file.
      Literal(node) {
        reportForbiddenLiteral(node, node.value)
      },

      TemplateElement(node) {
        reportForbiddenLiteral(node, node.value && node.value.cooked)
      }
    }
  }
}
