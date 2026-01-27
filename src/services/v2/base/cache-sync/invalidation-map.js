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
    keys: [queryKeys.workload.lists(), queryKeys.workload.details()]
  },
  {
    prefix: 'Domain',
    group: GROUPS.WORKLOADS,
    keys: [queryKeys.workload.lists(), queryKeys.workload.details()]
  },
  {
    prefix: 'Edge Application',
    group: GROUPS.EDGE_APP,
    keys: [queryKeys.edgeApp.lists(), queryKeys.edgeApp.details()]
  },
  {
    prefix: 'Application',
    group: GROUPS.EDGE_APP,
    keys: [queryKeys.edgeApp.lists(), queryKeys.edgeApp.details()]
  },
  {
    prefix: 'Edge Function',
    group: GROUPS.EDGE_APP_FUNCTIONS,
    keys: [queryKeys.edgeAppFunctions.lists(), queryKeys.edgeAppFunctions.details()]
  },
  {
    prefix: 'ApplicationFunctionInstance',
    group: GROUPS.EDGE_APP_FUNCTIONS,
    keys: [queryKeys.edgeAppFunctions.lists(), queryKeys.edgeAppFunctions.details()]
  },
  {
    prefix: 'ApplicationRuleEngineRequestPhase',
    group: GROUPS.EDGE_APP_RULES_ENGINE,
    keys: [queryKeys.rulesEngine.lists(), queryKeys.rulesEngine.details()]
  },
  {
    prefix: 'ApplicationRuleEngineResponsePhase',
    group: GROUPS.EDGE_APP_RULES_ENGINE,
    keys: [queryKeys.rulesEngine.lists(), queryKeys.rulesEngine.details()]
  },
  {
    prefix: 'Origin',
    group: GROUPS.EDGE_APP_ORIGINS,
    keys: [queryKeys.origins.lists(), queryKeys.origins.details()]
  },
  {
    prefix: 'CacheSetting',
    group: GROUPS.EDGE_APP_CACHE_SETTINGS,
    keys: [queryKeys.cacheSettings.lists(), queryKeys.cacheSettings.details()]
  },
  {
    prefix: 'DeviceGroup',
    group: GROUPS.EDGE_APP_DEVICE_GROUPS,
    keys: [queryKeys.deviceGroups.lists(), queryKeys.deviceGroups.details()]
  },
  {
    prefix: 'ErrorResponses',
    group: GROUPS.EDGE_APP_ERROR_RESPONSES,
    keys: [queryKeys.errorResponse.lists(), queryKeys.errorResponse.details()]
  },
  {
    prefix: 'Firewall',
    group: GROUPS.EDGE_FIREWALL,
    keys: [queryKeys.edgeFirewall.lists(), queryKeys.edgeFirewall.details()]
  },
  {
    prefix: 'FirewallFunctionInstance',
    group: GROUPS.EDGE_FIREWALL_FUNCTIONS,
    keys: [queryKeys.edgeFirewallFunctions.lists(), queryKeys.edgeFirewallFunctions.details()]
  },
  {
    prefix: 'FirewallRuleEngine',
    group: GROUPS.EDGE_FIREWALL_RULES_ENGINE,
    keys: [queryKeys.edgeFirewallRulesEngine.lists(), queryKeys.edgeFirewallRulesEngine.details()]
  },
  {
    prefix: 'Rule Engine',
    group: null,
    keys: [
      queryKeys.rulesEngine.lists(),
      queryKeys.rulesEngine.details(),
      queryKeys.edgeFirewallRulesEngine.lists(),
      queryKeys.edgeFirewallRulesEngine.details()
    ]
  },
  {
    prefix: 'Edge Function',
    group: null,
    keys: [
      queryKeys.edgeAppFunctions.lists(),
      queryKeys.edgeAppFunctions.details(),
      queryKeys.edgeFirewallFunctions.lists(),
      queryKeys.edgeFirewallFunctions.details()
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
