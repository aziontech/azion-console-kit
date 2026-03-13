const editRoute =
  (name, params = {}) =>
  ({ id }) => ({
    name,
    params: { id: String(id), ...params }
  })

const tryParseJson = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value
  const text = String(value).trim()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    try {
      return JSON.parse(text.replaceAll('\\"', '"'))
    } catch {
      return null
    }
  }
}

const extractBucketName = (event) => {
  const raw = event?.requestDataRaw ?? event?.requestData
  const parsed = tryParseJson(raw)
  const name = parsed?.name
  return name !== null && name !== undefined && String(name).trim() !== '' ? name : null
}

const extractBucketObjectInfo = (event) => {
  const raw = event?.requestDataRaw ?? event?.requestData
  const parsed = tryParseJson(raw)

  const bucketName = parsed?.bucket_name
  const objectKey = parsed?.object_key

  const normalizedBucketName =
    bucketName !== null && bucketName !== undefined && String(bucketName).trim() !== ''
      ? String(bucketName)
      : null

  const key = objectKey !== null && objectKey !== undefined ? String(objectKey) : ''
  const lastSlashIndex = key.lastIndexOf('/')
  const folderPath = lastSlashIndex >= 0 ? key.slice(0, lastSlashIndex + 1) : ''

  return {
    bucketName: normalizedBucketName,
    folderPath
  }
}

const listRoute = (name) => () => ({ name })

/**
 * Maps child resourceType to the appropriate tab for each parentResourceType.
 * This enables routing to the correct tab when navigating from activity history.
 */
const CHILD_TO_TAB_MAP = {
  Application: {
    'Application Cache Setting': 'cache-settings',
    'Application Function Instance': 'functions',
    'Application Request Rule': 'rules-engine',
    'Application Device Group': 'device-groups',
    'Application Origin': 'origins',
    'Application Error Response': 'error-responses'
  },
  Bucket: {
    BucketObject: null,
    'Storage Bucket Object': null
  },
  Waf: {
    'Waf Exception': 'allowed'
  },
  Schema: {
    Table: 'tables',
    Tables: 'tables',
    Editor: 'editor',
    Settings: 'settings'
  },
  'Custom Page': {},
  'Purge:cachekey': {},
  Credential: {
    ObjectStorageCredential: 'object-storage',
    Credential: 'object-storage'
  },
  Workload: {
    'Workload Deployment': null // Workload Deployment redirects to parent Workload
  },
  'Dns Zone': {
    'Dns Zone Record': 'records'
  }
}

/**
 * Maps parentResourceType to its route configuration.
 * This defines how to navigate to parent resources.
 */
const PARENT_ROUTE_MAP = {
  Application: {
    edit: 'edit-application',
    list: 'list-applications'
  },
  Bucket: {
    edit: 'object-storage-edit',
    list: 'object-storage-list'
  },
  Connector: {
    edit: 'edit-connectors',
    list: 'list-connectors'
  },
  Schema: {
    edit: 'database-sql-database',
    list: 'list-sql-databases'
  },
  'Custom Page': {
    edit: 'edit-custom-pages',
    list: 'list-custom-pages'
  },
  'Purge:cachekey': {
    edit: 'list-real-time-purge',
    list: 'list-real-time-purge'
  },
  Credential: {
    edit: 'credentials-tabs',
    list: 'credentials-tabs',
    defaultTab: 'object-storage'
  },
  Workload: {
    edit: 'edit-workload',
    list: 'list-workloads'
  },
  Waf: {
    edit: 'edit-waf-rules',
    list: 'list-waf-rules'
  },
  'Dns Zone': {
    edit: 'edit-edge-dns',
    list: 'list-edge-dns'
  }
}

const routePurge = { edit: 'list-real-time-purge', list: 'list-real-time-purge' }
const routeCertificate = { edit: 'edit-digital-certificates', list: 'list-digital-certificates' }

const ROUTE_MAP = {
  NetworkList: { edit: 'edit-network-list', list: 'list-network-list' },
  'Network List': { edit: 'edit-network-list', list: 'list-network-list' },
  Function: { edit: 'edit-functions', list: 'list-functions' },
  'Tls Certificate': routeCertificate,
  'Tls Certificate Revocation List': routeCertificate,
  'Tls Certificate Signing Request': routeCertificate,
  'Tls Certificate Request': routeCertificate,
  Stream: { edit: 'edit-data-stream', list: 'list-data-stream' },
  'Stream Template': { edit: 'edit-data-stream', list: 'list-data-stream' },
  Firewall: { edit: 'edit-firewall', list: 'list-firewalls' },
  'Firewall Request Rule': {
    edit: 'edit-firewall',
    list: 'edit-firewall',
    parentType: 'Firewall',
    tab: 'rulesEngine'
  },
  'Firewall Function Instance': {
    edit: 'edit-firewall',
    list: 'edit-firewall',
    parentType: 'Firewall',
    tab: 'functions'
  },
  'Dns Zone Record': {
    edit: 'edit-edge-dns',
    list: 'list-edge-dns',
    parentType: 'DNS Zone',
    tab: 'records'
  },
  'DNS Zone': { edit: 'edit-edge-dns', list: 'list-edge-dns' },
  'DNS DNSSec': {
    edit: 'edit-edge-dns',
    list: 'list-edge-dns',
    parentType: 'DNS Zone',
    tab: 'records'
  },
  'Dns Zone Dnssec': { edit: 'edit-edge-dns', list: 'list-edge-dns' },
  WAF: { edit: 'edit-waf-rules', list: 'list-waf-rules', tab: 'allowed' },

  Workload: { edit: 'edit-workload', list: 'list-workloads' },
  'Workload Deployment': { edit: 'edit-workload', list: 'list-workloads' },
  Application: { edit: 'edit-application', list: 'list-applications' },
  Bucket: { edit: 'object-storage-edit', list: 'object-storage-list' },
  BucketObject: { edit: 'object-storage-view', list: 'object-storage-view' },
  'Storage Bucket Object': { edit: 'object-storage-view', list: 'object-storage-view' },
  Connector: { edit: 'edit-connectors', list: 'list-connectors' },
  Schema: { edit: 'database-sql-database', list: 'list-sql-databases' },
  'Sql Database': { edit: 'database-sql-database', list: 'list-sql-databases' },
  'Custom Page': { edit: 'edit-custom-pages', list: 'list-custom-pages' },
  'Purge Cache Key': routePurge,
  'Purge Cache Key L2': routePurge,
  'Purge URL': routePurge,
  'Purge Wildcard': routePurge,
  'Purge:cachekey': routePurge,
  'Purge:l2cachekey': routePurge,
  'Purge:url': routePurge,
  'Purge:wildcard': routePurge,
  'Account Credential': {
    edit: 'credentials-tabs',
    list: 'credentials-tabs',
    params: { tab: 'object-storage' }
  },
  User: { edit: 'edit-users', list: 'list-users' }
}

const resolveAction = (action) => {
  const normalized = String(action || '')
    .trim()
    .toLowerCase()

  switch (normalized) {
    case 'edited':
    case 'updated':
    case 'update':
    case 'created':
    case 'changed':
      return 'edit'
    case 'deleted':
    case 'removed':
      return 'list'
    default:
      return null
  }
}

const normalizeResourceType = (resourceType) => {
  const raw = String(resourceType || '').trim()
  if (!raw) return null

  const normalized = raw.toLowerCase()
  const aliases = {
    workloads: 'Workload',
    workload: 'Workload',
    networklist: 'NetworkList',
    function: 'Function',
    certificate: 'Certificate',
    datastream: 'DataStream',
    firewall: 'Firewall',
    firewallruleengine: 'FirewallRuleEngine',
    firewallfunctioninstance: 'FirewallFunctionInstance',
    waf: 'WAF',
    application: 'Application',
    bucket: 'Bucket',
    buckets: 'Bucket',
    'bucket object': 'BucketObject',
    bucketobject: 'BucketObject',
    'dns record': 'DNS Record',
    'dns zone': 'DNS Zone',
    'dns dnssec': 'DNS DNSSec',
    schema: 'Schema',
    schemas: 'Schema',
    // Application Cache Setting
    'application cache setting': 'Application Cache Setting',
    applicationcachesetting: 'Application Cache Setting',
    applicationcachesettings: 'Application Cache Setting',
    cachesetting: 'Application Cache Setting',
    cachesettings: 'Application Cache Setting',
    // Application Function Instance
    'application function instance': 'Application Function Instance',
    applicationfunctioninstance: 'Application Function Instance',
    functioninstance: 'Application Function Instance',
    // Application Request Rule
    'application request rule': 'Application Request Rule',
    applicationrequestrule: 'Application Request Rule',
    'request rule': 'Application Request Rule',
    requestrule: 'Application Request Rule',
    rulesengine: 'Application Request Rule',
    'rules engine': 'Application Request Rule',
    // Application Device Group
    'application device group': 'Application Device Group',
    applicationdevicegroup: 'Application Device Group',
    devicegroup: 'Application Device Group',
    'device group': 'Application Device Group',
    // Application Origin
    'application origin': 'Application Origin',
    applicationorigin: 'Application Origin',
    // Application Error Response
    'application error response': 'Application Error Response',
    applicationerrorresponse: 'Application Error Response',
    errorresponse: 'Application Error Response',
    'error response': 'Application Error Response',
    // SQL Database
    table: 'Table',
    tables: 'Table',
    editor: 'Editor'
  }

  return aliases[normalized] || raw
}

/**
 * Normalizes parentResourceType to standard format
 */
const normalizeParentResourceType = (parentResourceType) => {
  const raw = String(parentResourceType || '').trim()
  if (!raw) return null

  const normalized = raw.toLowerCase()
  const aliases = {
    application: 'Application',
    applications: 'Application',
    bucket: 'Bucket',
    buckets: 'Bucket',
    connector: 'Connector',
    connectors: 'Connector',
    schema: 'Schema',
    schemas: 'Schema',
    custompages: 'CustomPages',
    'custom pages': 'CustomPages',
    'purge:cachekey': 'Purge:cachekey',
    purge: 'Purge:cachekey',
    credential: 'Credential',
    credentials: 'Credential',
    workload: 'Workload',
    workloads: 'Workload'
  }

  return aliases[normalized] || raw
}

const extractId = (event) => {
  const id =
    event?.resourceId ??
    event?.resourceItemId ??
    event?.resourceName ??
    event?.resourceItemName ??
    null

  return id !== null && String(id).trim() !== '' ? id : null
}

/**
 * Determines the appropriate tab for a child resource within a parent.
 * @param {string} parentResourceType - The normalized parent resource type
 * @param {string} resourceType - The normalized child resource type
 * @returns {string|null} - The tab name or null if no specific tab
 */
const resolveTabForChild = (parentResourceType, resourceType) => {
  const tabMap = CHILD_TO_TAB_MAP[parentResourceType]
  if (!tabMap) return null

  // Try exact match first
  if (tabMap[resourceType]) return tabMap[resourceType]

  // Try case-insensitive match
  const normalizedResourceType = resourceType?.toLowerCase()
  for (const [key, value] of Object.entries(tabMap)) {
    if (key.toLowerCase() === normalizedResourceType) {
      return value
    }
  }

  return null
}

/**
 * Resolves route when navigating to a parent resource with a specific tab
 * based on the child resource type.
 */
const resolveParentRouteWithTab = (event, resolvedAction) => {
  const parentResourceType = normalizeParentResourceType(event?.parentResourceType)
  const parentResourceId = event?.parentResourceId
  const resourceType = normalizeResourceType(event?.resourceType)

  if (!parentResourceType || !parentResourceId) return null

  const parentConfig = PARENT_ROUTE_MAP[parentResourceType]
  if (!parentConfig) return null

  const routeName = parentConfig[resolvedAction]
  if (!routeName) return null

  // Determine the appropriate tab based on the child resource type
  const tab = resolveTabForChild(parentResourceType, resourceType)

  const params = { id: String(parentResourceId) }
  if (tab) {
    params.tab = tab
  } else if (parentConfig.defaultTab) {
    params.tab = parentConfig.defaultTab
  }

  return {
    name: routeName,
    params: { ...params, ...(parentConfig.params || {}) }
  }
}

const resolveParentRoute = (event, routeConfig, resolvedAction) => {
  const parentResourceId = event?.parentResourceId
  if (!parentResourceId) return null

  const routeName = routeConfig[resolvedAction]
  if (!routeName) return null

  const params = { id: String(parentResourceId) }
  if (routeConfig.tab) {
    params.tab = routeConfig.tab
  }

  return {
    name: routeName,
    params: { ...params, ...(routeConfig.params || {}) }
  }
}

export const resolveActivityHistoryRoute = (event = {}) => {
  const resourceType = normalizeResourceType(event?.resourceType)
  const parentResourceType = normalizeParentResourceType(event?.parentResourceType)
  const action = event?.type

  const resolvedAction = resolveAction(action)
  if (!resolvedAction) return null

  // First, check if there's a parentResourceType with parentResourceId
  // This indicates a child resource that should navigate to its parent with the correct tab
  if (parentResourceType && event?.parentResourceId) {
    const parentRoute = resolveParentRouteWithTab(event, resolvedAction)
    if (parentRoute) return parentRoute
  }

  const routeConfig = ROUTE_MAP[resourceType]
  if (!routeConfig) return null

  // Check if this resource type requires parent routing (legacy support)
  if (routeConfig.parentType) {
    const parentRoute = resolveParentRoute(event, routeConfig, resolvedAction)
    if (parentRoute) return parentRoute
  }

  if (resourceType === 'BucketObject' || resourceType === 'Storage Bucket Object') {
    if (resolvedAction !== 'edit') return listRoute(routeConfig.list)()

    const { bucketName, folderPath } = extractBucketObjectInfo(event)
    if (!bucketName) return null

    return {
      name: routeConfig.edit,
      params: { id: String(bucketName), ...(routeConfig.params || {}) },
      query: folderPath ? { folderPath } : undefined
    }
  }

  const id =
    resourceType === 'Bucket' ? extractBucketName(event) || extractId(event) : extractId(event)

  if (resolvedAction === 'edit') {
    if (!id) return null
    return editRoute(routeConfig.edit, routeConfig.params)({ id })
  }

  return listRoute(routeConfig.list)()
}
