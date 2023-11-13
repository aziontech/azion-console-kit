import { azionDocumentationWindowOpener } from './azion-documentation-window-opener'

export const documentationCatalog = {
  resources: () => azionDocumentationWindowOpener(''),
  variables: () => azionDocumentationWindowOpener('variables'),
  edgeServices: () => azionDocumentationWindowOpener('edge services'),
  intelligentDNS: () => azionDocumentationWindowOpener('intelligent-dns'),
  personalTokens: () => azionDocumentationWindowOpener('personal tokens'),
  domains: () => azionDocumentationWindowOpener('domains'),
  realTimePurge: () => azionDocumentationWindowOpener('real-time-purge')
}
