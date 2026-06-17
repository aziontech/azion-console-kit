export const resourcePackTypeMeta = [
  { key: 'workload', label: 'Workload', icon: 'ai ai-workloads' },
  { key: 'application', label: 'Application', icon: 'ai ai-edge-application' },
  { key: 'variable', label: 'Variable', icon: 'ai ai-variables' },
  { key: 'connector', label: 'Connector', icon: 'ai ai-edge-connectors' },
  { key: 'edgeDns', label: 'Edge DNS', icon: 'ai ai-edge-dns' },
  { key: 'firewall', label: 'Firewall', icon: 'ai ai-edge-firewall' },
  { key: 'edgeNode', label: 'Edge Node', icon: 'ai ai-edge-nodes' },
  { key: 'dataStream', label: 'Data Stream', icon: 'ai ai-data-stream' },
  { key: 'edgePulse', label: 'Edge Pulse', icon: 'ai ai-edge-pulse' },
  { key: 'realTimeMetrics', label: 'Real-Time Metrics', icon: 'ai ai-real-time-metrics' },
  { key: 'realTimeEvents', label: 'Real-Time Events', icon: 'ai ai-real-time-events' },
  { key: 'siem', label: 'SIEM', icon: 'pi pi-chart-bar' },
  { key: 'realTimePurge', label: 'Real-Time Purge', icon: 'ai ai-real-time-purge' },
  { key: 'digitalCertificate', label: 'Certificate Manager', icon: 'ai ai-digital-certificates' },
  { key: 'customPage', label: 'Custom Page', icon: 'ai ai-custom-pages' },
  { key: 'edgeService', label: 'Edge Service', icon: 'ai ai-edge-services' },
  { key: 'function', label: 'Function', icon: 'ai ai-edge-functions' },
  { key: 'networkList', label: 'Network List', icon: 'ai ai-network-lists' },
  { key: 'wafRule', label: 'WAF Rule', icon: 'ai ai-waf-rules' },
  { key: 'objectStorage', label: 'Object Storage', icon: 'ai ai-edge-storage' },
  { key: 'sqlDatabase', label: 'SQL Database', icon: 'ai ai-edge-sql' }
]

export const RESOURCE_PACK_VISIBLE_SLOTS = 3

export const RESOURCE_PACK_DEFAULT_KEYS = ['application', 'firewall', 'customPage']

export const RESOURCE_PACK_PRIORITY_KEYS = ['application', 'firewall', 'customPage']

const resourcePackMetaByKey = Object.fromEntries(
  resourcePackTypeMeta.map((meta) => [meta.key, meta])
)

const sortKeysByPriority = (keys) => {
  const priorityIndex = (key) => {
    const idx = RESOURCE_PACK_PRIORITY_KEYS.indexOf(key)
    return idx === -1 ? Number.POSITIVE_INFINITY : idx
  }
  const metaIndex = (key) => resourcePackTypeMeta.findIndex((meta) => meta.key === key)

  return [...keys].sort((keyA, keyB) => {
    const priorityA = priorityIndex(keyA)
    const priorityB = priorityIndex(keyB)
    if (priorityA !== priorityB) return priorityA - priorityB
    return metaIndex(keyA) - metaIndex(keyB)
  })
}

export const normalizeText = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()

export const getDeploymentStatus = (deployment) => normalizeText(deployment?.status?.content)

export const getResourcePackRows = (deployment) => {
  return resourcePackTypeMeta
    .map((meta) => {
      const entry = deployment?.resourcePack?.[meta.key]
      if (!entry) return null

      return {
        key: meta.key,
        label: meta.label,
        icon: meta.icon,
        name: entry.name || '--',
        hash: entry.hash || '--'
      }
    })
    .filter(Boolean)
}

export const getResourcePackDisplay = (deployment) => {
  const pack = deployment?.resourcePack || {}

  const userKeys = sortKeysByPriority(
    Object.keys(pack).filter((key) => pack[key] && resourcePackMetaByKey[key])
  )

  const hasOverflow = userKeys.length > RESOURCE_PACK_VISIBLE_SLOTS
  const visibleLimit = hasOverflow ? RESOURCE_PACK_VISIBLE_SLOTS - 1 : RESOURCE_PACK_VISIBLE_SLOTS
  const visibleKeys = userKeys.slice(0, visibleLimit)

  if (!hasOverflow && visibleKeys.length < RESOURCE_PACK_VISIBLE_SLOTS) {
    for (const defaultKey of RESOURCE_PACK_DEFAULT_KEYS) {
      if (visibleKeys.length >= RESOURCE_PACK_VISIBLE_SLOTS) break
      if (!visibleKeys.includes(defaultKey)) visibleKeys.push(defaultKey)
    }
  }

  const buildRowFromKey = (key) => {
    const meta = resourcePackMetaByKey[key]
    const entry = pack[key]

    return {
      key,
      label: meta.label,
      icon: meta.icon,
      name: entry?.name || '--',
      hash: entry?.hash || ''
    }
  }

  const rows = visibleKeys.map((key) => {
    const meta = resourcePackMetaByKey[key]
    const entry = pack[key]
    const isPlaceholder = !entry

    return {
      key,
      label: meta.label,
      icon: meta.icon,
      name: isPlaceholder ? '--' : entry.name || '--',
      hash: isPlaceholder ? '' : entry.hash || '',
      isPlaceholder
    }
  })

  const overflowKeys = hasOverflow ? userKeys.slice(visibleLimit) : []
  const overflowItems = overflowKeys.map(buildRowFromKey)
  const overflowCount = overflowItems.length

  return { rows, overflowCount, overflowItems }
}

export const isReadonlyStatus = (status) => {
  const normalized = normalizeText(status)
  return normalized === 'ready' || normalized === 'building'
}
