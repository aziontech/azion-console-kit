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
  edgeApplication: () => openSearchResult('edge application'),
  edgeApplicationOrigins: () => openSearchResult('edge application origins'),
  edgeApplicationDeviceGroups: () => openSearchResult('edge application device groups'),
  users: () => openSearchResult('users'),
  activityHistory: () => openSearchResult('activity history'),
  edgeNodes: () => openSearchResult('edge nodes'),
  records: () => openSearchResult('records')
}

export const documentationGuideProducts = {
  edgeApplication: () => openDocumentationProducts('guides/build/build-an-application/'),
  realTimeMetrics: () => openDocumentationProducts('guides/use-real-time-metrics/'),
  edgeServicesResources: () =>
    openDocumentationProducts('edge-orchestrator/edge-services/#resources')
}
