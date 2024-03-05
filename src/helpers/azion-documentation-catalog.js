import { openSearchResult, openDocumentationProducts } from './azion-documentation-window-opener'

export const documentationCatalog = {
  resources: () => openSearchResult(''),
  variables: () => openSearchResult('variables'),
  edgeServices: () => openSearchResult('edge services'),
  intelligentDNS: () => openSearchResult('intelligent-dns'),
  personalTokens: () => openSearchResult('personal tokens'),
  domains: () => openSearchResult('domains'),
  realTimePurge: () => openSearchResult('real-time-purge'),
  getStarted: () => openSearchResult('get started'),
  digitalCertificates: () => openSearchResult('digital certificates'),
  credentials: () => openSearchResult('credentials'),
  networkLists: () => openSearchResult('network lists'),
  teamPermissions: () => openSearchResult('team permissions'),
  dataStreaming: () => openSearchResult('data streaming'),
  edgeFunctions: () => openSearchResult('edge functions'),
  edgeFirewall: () => openSearchResult('edge firewall'),
  edgeFirewallRulesEngine: () => openSearchResult('edge firewall rules engine'),
  edgeApplication: () => openSearchResult('edge application'),
  edgeApplicationOrigins: () => openSearchResult('edge application origins'),
  edgeApplicationCacheSettings: () => openSearchResult('cache settings'),
  edgeApplicationFunctions: () => openSearchResult('edge application functions instances'),
  edgeApplicationDeviceGroups: () => openSearchResult('edge application device groups'),
  edgeApplicationRulesEngine: () => openSearchResult('edge application rules engine'),
  users: () => openSearchResult('users'),
  activityHistory: () => openSearchResult('activity history'),
  edgeNodes: () => openSearchResult('edge nodes'),
  records: () => openSearchResult('records'),
  waf: () => openSearchResult('waf'),
  wafAllowed: () => openSearchResult('Allowed Rules'),
  wafTuning: () => openSearchResult('Tune')
}

export const documentationGuideProducts = {
  edgeApplication: () => openDocumentationProducts('guides/build/build-an-application/'),
  realTimeMetrics: () => openDocumentationProducts('guides/use-real-time-metrics/'),
  realTimeEventsHttpRequest: () => openDocumentationProducts('real-time-events/#http-requests'),
  realTimeEventsEdgeFunctions: () => openDocumentationProducts('real-time-events/#edge-functions'),
  realTimeEventsEdgeFunctionsConsole: () =>
    openDocumentationProducts('real-time-events/#edge-functions-console'),
  realTimeEventsImageProcessor: () =>
    openDocumentationProducts('real-time-events/#image-processor'),
  realTimeEventsL2Cache: () => openDocumentationProducts('real-time-events/#tiered-cache'),
  realTimeEventsIntelligentDNS: () =>
    openDocumentationProducts('real-time-events/#intelligent-dns'),
  realTimeEventsDataStreaming: () => openDocumentationProducts('real-time-events/#data-streaming'),
  realTimeEventsActivityHistory: () =>
    openDocumentationProducts('real-time-events/#activity-history'),
  edgeServicesResources: () =>
    openDocumentationProducts('edge-orchestrator/edge-services/#resources')
}
