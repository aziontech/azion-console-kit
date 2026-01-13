import { openSearchResult, openDocumentationProducts } from './azion-documentation-window-opener'

export const documentationCatalog = {
  resources: () => openSearchResult(''),
  variables: () => openSearchResult('variables'),
  edgeServices: () => openSearchResult('edge services'),
  edgeDNS: () => openSearchResult('edge-dns'),
  personalTokens: () => openSearchResult('personal tokens'),
  domains: () => openSearchResult('domains'),
  realTimePurge: () => openSearchResult('real-time-purge'),
  getStarted: () => openSearchResult('get started'),
  digitalCertificates: () => openSearchResult('digital certificates'),
  networkLists: () => openSearchResult('network lists'),
  teamPermissions: () => openSearchResult('team permissions'),
  dataStream: () => openSearchResult('data streaming'),
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
  wafTuning: () => openSearchResult('Tune'),
  customPages: () => openSearchResult('Error Responses'),
  mfaManagement: () => openSearchResult('MFA Management'),
  edgeConnectors: () => openSearchResult('Origins'),
  workload: () => openSearchResult('workload'),
  edgeSQL: () => openSearchResult('edge-sql'),
  edgeStorage: () => openSearchResult('edge storage'),
  credentials: () => openSearchResult('credentials')
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
  realTimeEventsTieredCache: () => openDocumentationProducts('real-time-events/#tiered-cache'),
  realTimeEventsEdgeDNS: () => openDocumentationProducts('real-time-events/#edge-dns'),
  realTimeEventsDataStream: () => openDocumentationProducts('real-time-events/#data-streaming'),

  realTimeEventsActivityHistory: () =>
    openDocumentationProducts('real-time-events/#activity-history'),
  edgeServicesResources: () =>
    openDocumentationProducts('edge-orchestrator/edge-services/#resources'),
  edgeDnsRecordTypes: () => openDocumentationProducts('secure/edge-dns/#type'),
  generateLetsEncryptCertificate: () =>
    openDocumentationProducts('guides/how-to-generate-a-lets-encrypt-certificate'),
  paymentMethods: () =>
    openDocumentationProducts('guides/billing-and-subscriptions/#payment-methods'),
  paymentHistory: () =>
    openDocumentationProducts('guides/billing-and-subscriptions/#payment-history'),
  customPages: () => openDocumentationProducts('guides/customizing-error-response-page'),
  edgeStorage: () => openDocumentationProducts('store/edge-storage'),
  edgeSQL: () => openDocumentationProducts('store/edge-sql'),
  sso: () => openDocumentationProducts('guides/sso/'),
}

export const documentationStoreProducts = {
  bucket: () => openDocumentationProducts('store/storage/create-bucket/'),
  objectStorage: () => openDocumentationProducts('store/object-storage/'),
  sqlDatabase: () => openDocumentationProducts('store/sql-database/'),
}

export const documentationSecureProducts = {
  workload: () => openDocumentationProducts('secure/workloads/'),
  connectors: () => openDocumentationProducts('secure/connectors/'),
  edgeDNS: () => openDocumentationProducts('secure/edge-dns/'),
  firewall: () => openDocumentationProducts('secure/firewall/'),
  customPages: () => openDocumentationProducts('secure/custom-pages/'),
  networkLists: () => openDocumentationProducts('secure/edge-firewall/network-layer-protection/network-lists/'),
  wafRules: () => openDocumentationProducts('secure/firewall/web-application-firewall/'),
}

export const documentationBuildProducts = {
  domains: () => openDocumentationProducts('build/applications/domains'),
  applications: () => openDocumentationProducts('build/applications'),
  realTimePurge: () => openDocumentationProducts('build/applications/real-time-purge'),
  certificateManager: () => openDocumentationProducts('build/applications/certificate-manager'),
}

export const documentationAccountsProducts = {
  accounts: () => openDocumentationProducts('accounts/accounts/'),
  usersManagement: () => openDocumentationProducts('accounts/users-management/'),
  billing: () => openDocumentationProducts('accounts/billing-and-subscriptions/'),
  teamPermissions: () => openDocumentationProducts('accounts/teams-permissions/'),
  personalTokens: () => openDocumentationProducts('accounts/personal-tokens/'),
  mfaManagement: () => openDocumentationProducts('accounts/multi-factor-authentication/'),
}

export const documentationDeployProducts = {
  edgeNode: () => openDocumentationProducts('deploy/orchestrator/edge-node/'),
  edgeServices: () => openDocumentationProducts('deploy/orchestrator/edge-services/'),
}

export const documentationObserveProducts = {
  dataStream: () => openDocumentationProducts('observe/data-stream/')
}
