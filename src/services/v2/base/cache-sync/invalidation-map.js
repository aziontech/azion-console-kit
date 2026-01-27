import { queryKeys } from '../query/queryKeys'

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
  TEAMS: 'teams'
}

const INVALIDATION_MAP = [
  {
    prefix: 'Workloads',
    group: GROUPS.WORKLOADS,
    keys: [queryKeys.workload.all]
  },
  {
    prefix: 'Domain',
    group: GROUPS.WORKLOADS,
    keys: [queryKeys.workload.all]
  },
  {
    prefix: 'Edge Application',
    group: GROUPS.EDGE_APP,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'Application',
    group: GROUPS.EDGE_APP,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'Edge Function',
    group: GROUPS.EDGE_APP_FUNCTIONS,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'ApplicationFunctionInstance',
    group: GROUPS.EDGE_APP_FUNCTIONS,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'ApplicationRuleEngineRequestPhase',
    group: GROUPS.EDGE_APP_RULES_ENGINE,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'ApplicationRuleEngineResponsePhase',
    group: GROUPS.EDGE_APP_RULES_ENGINE,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'Origin',
    group: GROUPS.EDGE_APP_ORIGINS,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'CacheSetting',
    group: GROUPS.EDGE_APP_CACHE_SETTINGS,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'DeviceGroup',
    group: GROUPS.EDGE_APP_DEVICE_GROUPS,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'ErrorResponses',
    group: GROUPS.EDGE_APP_ERROR_RESPONSES,
    keys: [queryKeys.edgeApp.all]
  },
  {
    prefix: 'Firewall',
    group: GROUPS.EDGE_FIREWALL,
    keys: [queryKeys.firewall.all]
  },
  {
    prefix: 'FirewallFunctionInstance',
    group: GROUPS.EDGE_FIREWALL_FUNCTIONS,
    keys: [queryKeys.firewall.all]
  },
  {
    prefix: 'FirewallRuleEngine',
    group: GROUPS.EDGE_FIREWALL_RULES_ENGINE,
    keys: [queryKeys.firewall.all]
  },
  {
    prefix: 'Rule Engine',
    group: null,
    keys: [
      queryKeys.edgeApp.all,
      queryKeys.firewall.all
    ]
  },
  {
    prefix: 'Edge Function',
    group: null,
    keys: [
      queryKeys.edgeApp.all,
      queryKeys.firewall.all
    ]
  },
  {
    prefix: 'Team',
    group: GROUPS.TEAMS,
    keys: [queryKeys.teams.all]
  }
]

export function getKeysForEvents(eventTitles) {
  if (!Array.isArray(eventTitles) || eventTitles.length === 0) return []

  const mappings = [...INVALIDATION_MAP].sort(
    (aPrefix, bPrefix) => (bPrefix?.length ?? 0) - (aPrefix?.length ?? 0)
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

export { INVALIDATION_MAP, GROUPS }
