import { queryKeys } from '../query/queryKeys'

// ============================================================================
// Factory Functions for RESOURCE_TYPE_MAP
// ============================================================================

/**
 * Creates a simple mapping that only returns the 'all' key.
 * Used for resources that don't need detail-level invalidation.
 *
 * @param {Object} queryKeyRef - Query key reference with 'all' property
 * @param {string|null} group - Optional group identifier
 * @returns {Object} Mapping object with group and getKeys
 */
const createSimpleMapping = (queryKeyRef, group = null) => ({
  group,
  getKeys: () => {
    // Handle both array and function for 'all' property
    const allKey = typeof queryKeyRef.all === 'function' ? queryKeyRef.all() : queryKeyRef.all
    return [allKey]
  }
})

/**
 * Creates a mapping that returns both 'all' and optional 'detail' keys.
 * Used for resources that need both collection and detail invalidation.
 *
 * @param {Object} queryKeyRef - Query key reference with 'all' and 'detail' properties
 * @param {string|null} group - Optional group identifier
 * @returns {Object} Mapping object with group and getKeys
 */
const createDetailMapping = (queryKeyRef, group) => ({
  group,
  getKeys: (resourceId) => {
    // Handle both array and function for 'all' property
    const allKey = typeof queryKeyRef.all === 'function' ? queryKeyRef.all() : queryKeyRef.all
    const keys = [allKey]
    if (resourceId != null) {
      keys.push(queryKeyRef.detail(resourceId))
    }
    return keys
  }
})

/**
 * Creates a mapping that returns multiple query keys.
 * Used for resources that affect multiple caches (e.g., functions affect apps and firewalls).
 *
 * @param {Object[]} queryKeyRefs - Array of query key references
 * @param {string|null} group - Optional group identifier
 * @returns {Object} Mapping object with group and getKeys
 */

/**
 * Creates multiple aliased entries in an object using a factory function.
 * Used for resources that share the same mapping under different names.
 *
 * @param {string[]} keys - Array of key names to create
 * @param {Function} factory - Factory function that receives the key and returns a mapping
 * @returns {Object} Object with all aliased entries
 */
const createAliasedMapping = (keys, factory) =>
  keys.reduce((acc, key) => {
    acc[key] = factory(key)
    return acc
  }, {})

// ============================================================================
// Helper for INVALIDATION_MAP
// ============================================================================

/**
 * Creates an invalidation entry for INVALIDATION_MAP.
 *
 * @param {string} prefix - Event title prefix to match
 * @param {string|null} group - Optional group for deduplication
 * @param {Array} keys - Array of query keys to invalidate
 * @returns {Object} Invalidation entry object
 */
const createInvalidationEntry = (prefix, group, keys) => ({ prefix, group, keys })

// ============================================================================
// Constants
// ============================================================================

const GROUPS = {
  EDGE_APP: 'edge-app',
  EDGE_APP_FUNCTIONS: 'edge-app-functions',
  EDGE_APP_RULES_ENGINE: 'edge-app-rules-engine',
  EDGE_APP_ORIGINS: 'edge-app-origins',
  EDGE_APP_CACHE_SETTINGS: 'edge-app-cache-settings',
  EDGE_APP_DEVICE_GROUPS: 'edge-app-device-groups',
  EDGE_APP_ERROR_RESPONSES: 'edge-app-error-responses',
  EDGE_FIREWALL: 'edge-firewall',
  EDGE_FIREWALL_FUNCTIONS: 'edge-firewall-functions',
  EDGE_FIREWALL_RULES_ENGINE: 'edge-firewall-rules-engine',
  WORKLOADS: 'workloads',
  TEAMS: 'teamPermission',
  EDGE_DNS: 'edge-dns',
  EDGE_STORAGE: 'edge-storage',
  DATA_STREAM: 'data-stream',
  EDGE_CONNECTORS: 'edge-connectors',
  WAF: 'waf',
  EDGE_SQL: 'edge-sql',
  NETWORK_LISTS: 'network-lists',
  DIGITAL_CERTIFICATES: 'digital-certificates',
  CUSTOM_PAGES: 'custom-pages',
  EDGE_SERVICE: 'edge-service',
  EDGE_NODE: 'edge-node',
  USER: 'users',
  ACCOUNT: 'account',
  BILLING: 'billing'
}

/**
 * Maps SSE parent types to queryKeys property names.
 * SSE parent.type values → queryKeys property names
 */
const PARENT_TYPE_TO_QUERY_KEY = {
  solution: 'solutions',
  marketplace: 'marketplace',
  domain: 'workload',
  workload: 'workload',

  // Edge Application
  application: 'application',
  'edge application': 'application',

  // Edge Firewall
  firewall: 'firewall',
  'edge firewall': 'firewall',

  //Secure
  connector: 'edgeConnectors',
  'dns zone dnssec': 'edgeDNS',
  'dns zone': 'edgeDNS',
  'edge dns': 'edgeDNS',

  //Store
  'edge storage': 'edgeStorage',
  'account credential': 'edgeStorage.credentials',
  'sql database': 'edgeSql',

  //Deploy
  'edge node': 'edgeNode',

  //Observe
  'data stream': 'dataStream',

  //Edge Liberies
  'digital certificate': 'digitalCertificates',
  'tls certificate': 'digitalCertificates',
  'tls certificate revocation list': 'digitalCertificatesCRL',
  'custom page': 'customPages',
  'edge service': 'edgeService',
  'edge function': 'edgeFunction',
  'network List': 'networkLists',
  waf: 'waf',

  // User Menu
  team: 'teamPermission', // ainda sem conseguir testar
  'team permission': 'teamPermission', // ainda se conseguir testar
  'personal token': 'personalToken',

  // Account: 'account',
  client: 'account',
  'account settings': 'accountSettings',
  billing: 'billing', // não lista em stage

  contract: 'contract'
}

/**
 * Maps resource types from SSE activity events to query keys.
 * Primary mapping used for structured invalidation.
 */
const RESOURCE_TYPE_MAP = {
  // Account & User
  account: createSimpleMapping(queryKeys.account, GROUPS.ACCOUNT),
  user: createSimpleMapping(queryKeys.users, GROUPS.USER),
  users: createSimpleMapping(queryKeys.users, GROUPS.USER),
  contract: createSimpleMapping(queryKeys.contract),
  account_settings: createSimpleMapping(queryKeys.accountSettings, GROUPS.ACCOUNT),
  billing: createSimpleMapping(queryKeys.billing, GROUPS.BILLING),
  personal_token: createSimpleMapping(queryKeys.personalToken),

  // Solutions & Marketplace
  solution: createSimpleMapping(queryKeys.solutions),
  marketplace: createSimpleMapping(queryKeys.marketplace),

  // Edge Application
  application: createDetailMapping(queryKeys.application, GROUPS.EDGE_APP),
  application_v3: createDetailMapping(queryKeys.applicationV3, GROUPS.EDGE_APP),
  variable: createSimpleMapping(queryKeys.variables),

  // Edge Firewall
  firewall: createDetailMapping(queryKeys.firewall, GROUPS.EDGE_FIREWALL),

  // Workloads
  workload: createDetailMapping(queryKeys.workload, GROUPS.WORKLOADS),
  domain: createSimpleMapping(queryKeys.workload, GROUPS.WORKLOADS),

  // Function - affects multiple caches
  function: createDetailMapping(queryKeys.edgeFunction),

  // Edge DNS - shared config for 'dns zone' and 'dns zone dnssec'
  ...createAliasedMapping(['dns zone dnssec', 'dns zone'], () =>
    createDetailMapping(queryKeys.edgeDNS, GROUPS.EDGE_DNS)
  ),

  // Edge Storage
  'storage bucket': createSimpleMapping(queryKeys.edgeStorage, GROUPS.EDGE_STORAGE),
  'storage bucket object': {
    group: GROUPS.EDGE_STORAGE,
    getKeys: () => [queryKeys.edgeStorage.all, [...queryKeys.edgeStorage.all, 'files']]
  },
  'account credential': createSimpleMapping(queryKeys.edgeStorage.credentials, GROUPS.EDGE_STORAGE),
  'sql database': {
    group: GROUPS.EDGE_SQL,
    getKeys: () => [queryKeys.edgeSql.all]
  },

  // Data Stream
  stream: createDetailMapping(queryKeys.dataStream, GROUPS.DATA_STREAM),

  // Connectors
  connector: createDetailMapping(queryKeys.edgeConnectors, GROUPS.EDGE_CONNECTORS),

  // Teams & Permissions
  team: createDetailMapping(queryKeys.teamPermission, GROUPS.TEAMS),
  team_permission: createDetailMapping(queryKeys.teamPermission, GROUPS.TEAMS),

  // WAF
  waf: createDetailMapping(queryKeys.waf, GROUPS.WAF),

  // Edge SQL
  edge_sql: createDetailMapping(queryKeys.edgeSql, GROUPS.EDGE_SQL),

  // Network Lists
  'network list': createDetailMapping(queryKeys.networkLists, GROUPS.NETWORK_LISTS),

  // Digital Certificates
  ...createAliasedMapping(
    ['tls certificate', 'tls certificate signing request', 'tls certificate request'],
    () => createDetailMapping(queryKeys.digitalCertificates, GROUPS.DIGITAL_CERTIFICATES)
  ),
  'tls certificate revocation list': createDetailMapping(
    queryKeys.digitalCertificatesCRL,
    GROUPS.DIGITAL_CERTIFICATES
  ),

  // Custom Pages
  'custom page': createDetailMapping(queryKeys.customPages, GROUPS.CUSTOM_PAGES),

  // Edge Service
  edge_service: createDetailMapping(queryKeys.edgeService, GROUPS.EDGE_SERVICE),

  // Edge Node
  edge_node: createDetailMapping(queryKeys.edgeNode, GROUPS.EDGE_NODE)
}

const INVALIDATION_MAP = [
  // Workloads
  createInvalidationEntry('Workloads', GROUPS.WORKLOADS, [queryKeys.workload.all]),
  createInvalidationEntry('Domain', GROUPS.WORKLOADS, [queryKeys.workload.all]),

  // Edge Application (grouped by related sub-resources)
  ...[
    { prefix: 'Edge Application', group: GROUPS.EDGE_APP },
    { prefix: 'Application', group: GROUPS.EDGE_APP },
    { prefix: 'ApplicationFunctionInstance', group: GROUPS.EDGE_APP_FUNCTIONS },
    { prefix: 'ApplicationRuleEngineRequestPhase', group: GROUPS.EDGE_APP_RULES_ENGINE },
    { prefix: 'ApplicationRuleEngineResponsePhase', group: GROUPS.EDGE_APP_RULES_ENGINE },
    { prefix: 'Origin', group: GROUPS.EDGE_APP_ORIGINS },
    { prefix: 'CacheSetting', group: GROUPS.EDGE_APP_CACHE_SETTINGS },
    { prefix: 'DeviceGroup', group: GROUPS.EDGE_APP_DEVICE_GROUPS },
    { prefix: 'ErrorResponses', group: GROUPS.EDGE_APP_ERROR_RESPONSES }
  ].map(({ prefix, group }) => createInvalidationEntry(prefix, group, [queryKeys.application.all])),

  // Firewall (grouped by related sub-resources)
  ...[
    { prefix: 'Firewall', group: GROUPS.EDGE_FIREWALL },
    { prefix: 'FirewallFunctionInstance', group: GROUPS.EDGE_FIREWALL_FUNCTIONS },
    { prefix: 'FirewallRuleEngine', group: GROUPS.EDGE_FIREWALL_RULES_ENGINE }
  ].map(({ prefix, group }) => createInvalidationEntry(prefix, group, [queryKeys.firewall.all])),

  // Multi-resource invalidation
  createInvalidationEntry('Rule Engine', null, [queryKeys.application.all, queryKeys.firewall.all]),
  createInvalidationEntry('Function', null, [
    queryKeys.edgeFunction.all,
    queryKeys.application.all,
    queryKeys.firewall.all
  ]),

  // Teams
  createInvalidationEntry('Team', GROUPS.TEAMS, [queryKeys.teams.all])
]

/**
 * Checks if a value is empty, null, or a hyphen.
 *
 * @param {*} value - Value to check
 * @returns {boolean} True if empty, null, or hyphen
 */

/**
 * Gets query keys to invalidate based on parent type and ID.
 *
 * @param {string} parentType - SSE parent.type (e.g., 'Application')
 * @param {string|number|null} parentId - SSE parent.id (e.g., '1772656941')
 * @returns {Array} Array of query keys to invalidate
 */
export function getParentKeys(parentType, parentId) {
  const queryKeyName = PARENT_TYPE_TO_QUERY_KEY[parentType] || parentType
  if (!queryKeyName) return []

  // Handle nested paths like 'edgeStorage.credentials'
  const queryKey = queryKeyName.includes('.')
    ? queryKeyName.split('.').reduce((obj, key) => obj?.[key], queryKeys)
    : queryKeys[queryKeyName]
  if (!queryKey) return []

  // Valid parent ID → targeted invalidation (detail only)
  if (queryKey.detail) {
    return [queryKey.detail(parentId)]
  }

  // Fallback to all if no detail method
  return [queryKey.all]
}

/**
 * Gets query keys to invalidate based on structured SSE activity event fields.
 *
 * @param {string} resourceType - The type of resource (e.g., 'edge_application')
 * @param {string} activityType - The activity type ('created', 'edited', 'deleted')
 * @param {number|string|null} resourceId - The resource ID from metadata.id
 * @returns {Array} Array of query keys to invalidate
 */
export function getKeysForResource(resourceType, activityType, resourceId) {
  if (!resourceType || !activityType) return []

  const mapping = RESOURCE_TYPE_MAP[resourceType]
  if (!mapping) return []

  return mapping.getKeys(resourceId)
}

/**
 * Gets query keys to invalidate based on SSE event titles.
 * Matches event titles against INVALIDATION_MAP prefixes and returns deduplicated keys.
 *
 * @param {string[]} eventTitles - Array of SSE event titles (e.g., ['Edge Application myapp was updated'])
 * @returns {Array} Array of query keys to invalidate
 */
export function getKeysForEvents(eventTitles) {
  if (!Array.isArray(eventTitles) || eventTitles.length === 0) return []

  const mappings = [...INVALIDATION_MAP].sort(
    (first, second) => (second.prefix?.length ?? 0) - (first.prefix?.length ?? 0)
  )
  const processedGroups = new Set()
  const keysToInvalidate = []
  const addedKeys = new Set()

  for (const title of eventTitles) {
    if (!title) continue
    const normalizedTitle = String(title).trim().toLowerCase()

    for (const mapping of mappings) {
      const prefix = String(mapping.prefix || '')
        .trim()
        .toLowerCase()
      if (!prefix) continue
      if (!normalizedTitle.startsWith(prefix)) continue

      if (mapping.group && processedGroups.has(mapping.group)) continue

      if (mapping.group) {
        processedGroups.add(mapping.group)
      }

      for (const key of mapping.keys) {
        const keyStr = JSON.stringify(key)
        if (!addedKeys.has(keyStr)) {
          addedKeys.add(keyStr)
          keysToInvalidate.push(key)
        }
      }
    }
  }

  return keysToInvalidate
}

export { GROUPS, PARENT_TYPE_TO_QUERY_KEY }
