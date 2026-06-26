import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'
import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
import { wafService } from '@/services/v2/waf/waf-service'
import { wafVersionService } from '@/services/v2/waf/waf-version-service'

const CATALOG_PAGE_SIZE = 100

// Versions are fetched in one large page so the picker lists EVERY Ready version
// (the endpoint default page is small — it returned only the newest 2). `pageSize`
// is mapped to `page_size` by buildQueryParams. `toVersionOptions` then keeps only
// the deployable (ready/active) ones.
const VERSIONS_PAGE_SIZE = 100

const toName = (name) => (name && typeof name === 'object' ? (name.text ?? '') : (name ?? ''))

const toCatalogItem = (resource) => ({ id: resource.id, name: toName(resource.name) })

const fromBody = (result) => (Array.isArray(result?.body) ? result.body : []).map(toCatalogItem)

export const RESOURCE_CATALOG_REGISTRY = {
  application: {
    versioned: true,
    listCatalog: () =>
      edgeAppService
        .listEdgeApplicationsService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody),
    listVersions: (id) => edgeAppVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  firewall: {
    versioned: true,
    listCatalog: () =>
      edgeFirewallService
        .listEdgeFirewallService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody),
    listVersions: (id) =>
      edgeFirewallVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  custom_page: {
    versioned: true,
    listCatalog: () =>
      customPageService.listCustomPagesService({ pageSize: CATALOG_PAGE_SIZE }).then(fromBody),
    listVersions: (id) =>
      customPageVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  function: {
    versioned: true,
    listCatalog: () =>
      edgeFunctionService
        .listEdgeFunctionsService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody),
    listVersions: (id) =>
      edgeFunctionVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  network_list: {
    versioned: true,
    listCatalog: () =>
      networkListsService.listNetworkLists({ page: 1, pageSize: CATALOG_PAGE_SIZE }).then(fromBody),
    listVersions: (id) =>
      networkListVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  connector: {
    versioned: true,
    listCatalog: () =>
      edgeConnectorsService
        .listEdgeConnectorsService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody),
    listVersions: (id) =>
      edgeConnectorVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  },
  waf: {
    versioned: true,
    listCatalog: () =>
      wafService.listWafRules({ page: 1, pageSize: CATALOG_PAGE_SIZE }).then(fromBody),
    listVersions: (id) => wafVersionService.listVersions(id, { pageSize: VERSIONS_PAGE_SIZE })
  }
}

export const isVersionedResourceType = (resourceType) =>
  Boolean(RESOURCE_CATALOG_REGISTRY[resourceType]?.versioned)
