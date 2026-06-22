import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'

const CATALOG_PAGE_SIZE = 100

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
    listVersions: (id) => edgeAppVersionService.listVersions(id)
  },
  firewall: {
    versioned: true,
    listCatalog: () =>
      edgeFirewallService
        .listEdgeFirewallService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody),
    listVersions: (id) => edgeFirewallVersionService.listVersions(id)
  },
  custom_page: {
    versioned: true,
    listCatalog: () =>
      customPageService.listCustomPagesService({ pageSize: CATALOG_PAGE_SIZE }).then(fromBody),
    listVersions: (id) => customPageVersionService.listVersions(id)
  },
  function: {
    versioned: false,
    listCatalog: () =>
      edgeFunctionService
        .listEdgeFunctionsService({ page: 1, pageSize: CATALOG_PAGE_SIZE })
        .then(fromBody)
  },
  network_list: {
    versioned: false,
    listCatalog: () =>
      networkListsService.listNetworkLists({ page: 1, pageSize: CATALOG_PAGE_SIZE }).then(fromBody)
  }
}

export const isVersionedResourceType = (resourceType) =>
  Boolean(RESOURCE_CATALOG_REGISTRY[resourceType]?.versioned)
