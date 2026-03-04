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

const ROUTE_MAP = {
  NetworkList: { edit: 'edit-network-list', list: 'list-network-list' },
  Function: { edit: 'edit-functions', list: 'list-functions' },
  Certificate: { edit: 'edit-digital-certificates', list: 'list-digital-certificates' },
  DataStream: { edit: 'edit-data-stream', list: 'list-data-stream' },
  Firewall: { edit: 'edit-firewall', list: 'list-firewalls' },
  FirewallRuleEngine: {
    edit: 'edit-firewall',
    list: 'edit-firewall',
    parentType: 'Firewall',
    tab: 'rulesEngine'
  },
  FirewallFunctionInstance: {
    edit: 'edit-firewall',
    list: 'edit-firewall',
    parentType: 'Firewall',
    tab: 'functions'
  },
  'DNS Record': {
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
  WAF: { edit: 'edit-waf-rules', list: 'list-waf-rules' },
  Workload: { edit: 'edit-workload', list: 'list-workloads' },
  Application: { edit: 'edit-application', list: 'list-applications' },
  Bucket: { edit: 'object-storage-edit', list: 'object-storage-list' },
  BucketObject: { edit: 'object-storage-view', list: 'object-storage-view' },
  Connector: { edit: 'edit-connectors', list: 'list-connectors' },
  Schema: { edit: 'database-sql-database', list: 'list-sql-databases' },
  CustomPages: { edit: 'edit-custom-pages', list: 'list-custom-pages' },
  'Purge:cachekey': { edit: 'list-real-time-purge', list: 'list-real-time-purge' },
  Credential: {
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
    schemas: 'Schema'
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
  const action = event?.type

  const routeConfig = ROUTE_MAP[resourceType]
  const resolvedAction = resolveAction(action)

  if (!routeConfig || !resolvedAction) return null

  // Check if this resource type requires parent routing
  if (routeConfig.parentType) {
    const parentRoute = resolveParentRoute(event, routeConfig, resolvedAction)
    if (parentRoute) return parentRoute
  }

  if (resourceType === 'BucketObject') {
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
