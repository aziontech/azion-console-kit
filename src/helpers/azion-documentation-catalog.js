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
  digitalCertificates: () => openSearchResult('digital certificates')
}

export const documentationGuideProducts = {
  edgeApplication: () => openDocumentationProducts('guides/build/build-an-application/'),
  realTimeMetrics: () => openDocumentationProducts('guides/use-real-time-metrics/')
}
