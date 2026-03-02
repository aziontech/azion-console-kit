const path = require('path')

/**
 * Classifies a file path into architectural zones and roles.
 *
 * Zones determine severity:
 *   - 'module' / 'v2-service' → error (blocks build)
 *   - 'legacy' / 'shared' / 'store' → warn (tracking only)
 *
 * Roles determine which rules apply:
 *   - 'component' → no-direct-http-in-components
 *   - 'store' → no-http-in-stores
 *   - 'composable' → require-vue-query
 *   - 'service' → no-try-catch-in-services, services-http-only
 *   - 'adapter' → pure-adapters, no-http-in-adapters
 */
function classifyPath(filePath) {
  const normalized = filePath.replace(/\\/g, '/')

  // Module files: src/modules/<name>/...
  const moduleMatch = normalized.match(/src\/modules\/([^/]+)\/(.+)/)
  if (moduleMatch) {
    return {
      zone: 'module',
      role: inferRole(moduleMatch[2]),
      moduleName: moduleMatch[1]
    }
  }

  // V2 services: src/services/v2/<domain>/...
  const v2Match = normalized.match(/src\/services\/v2\/(.+)/)
  if (v2Match) {
    const v2Rest = v2Match[1]
    const role = inferRole(v2Rest)
    return {
      zone: 'v2-service',
      role,
      moduleName: null
    }
  }

  // Stores: src/stores/...
  if (/src\/stores\//.test(normalized)) {
    return { zone: 'store', role: 'store', moduleName: null }
  }

  // Views: src/views/...
  if (/src\/views\//.test(normalized)) {
    return {
      zone: 'legacy',
      role: inferViewRole(normalized),
      moduleName: null
    }
  }

  // Legacy services: src/services/<name>-services/...
  if (/src\/services\/[^/]+-services\//.test(normalized)) {
    return {
      zone: 'legacy',
      role: inferRole(normalized),
      moduleName: null
    }
  }

  // Shared components: src/components/...
  if (/src\/components\//.test(normalized)) {
    return { zone: 'shared', role: 'component', moduleName: null }
  }

  // Shared composables: src/composables/...
  if (/src\/composables\//.test(normalized)) {
    return { zone: 'shared', role: 'composable', moduleName: null }
  }

  return { zone: 'unknown', role: 'unknown', moduleName: null }
}

function inferRole(relativePath) {
  const basename = path.basename(relativePath)

  if (/-adapter\.(js|ts)$/.test(basename)) return 'adapter'
  if (/adapters?\//.test(relativePath)) return 'adapter'

  if (/-service\.(js|ts)$/.test(basename)) return 'service'
  if (/services?\//.test(relativePath) && !relativePath.includes('base/')) return 'service'

  if (/^use[-A-Z]/.test(basename)) return 'composable'
  if (/composables?\//.test(relativePath)) return 'composable'

  if (/\.types\.(js|ts)$/.test(basename)) return 'type'
  if (/\.contracts\.(js|ts)$/.test(basename)) return 'type'

  if (/stores?\//.test(relativePath)) return 'store'
  if (/-store\.(js|ts)$/.test(basename)) return 'store'

  if (basename.endsWith('.vue')) return 'component'

  return 'unknown'
}

function inferViewRole(fullPath) {
  if (fullPath.endsWith('.vue')) return 'component'
  if (/-service\.(js|ts)$/.test(fullPath)) return 'service'
  if (/-adapter\.(js|ts)$/.test(fullPath)) return 'adapter'
  if (/composables?\//.test(fullPath) || /\/use[-A-Z]/.test(fullPath)) return 'composable'
  return 'unknown'
}

/**
 * Extracts the module name from an import source path.
 * Returns null if the import is not from a module.
 *
 * @param {string} importSource - e.g. '@/modules/azion-ai-chat/services/chat-service'
 * @returns {string|null}
 */
function getModuleFromImport(importSource) {
  const match = importSource.match(/@\/modules\/([^/]+)/)
  if (match) return match[1]

  const relativeMatch = importSource.match(/modules\/([^/]+)/)
  if (relativeMatch) return relativeMatch[1]

  return null
}

module.exports = {
  classifyPath,
  inferRole,
  getModuleFromImport
}
