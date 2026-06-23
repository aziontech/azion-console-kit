import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { edgeConnectorsService } from '@/services/v2/edge-connectors/edge-connectors-service'
import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
import { networkListsService } from '@/services/v2/network-lists/network-lists-service'
import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'
import { wafService } from '@/services/v2/waf/waf-service'
import { wafVersionService } from '@/services/v2/waf/waf-version-service'

/**
 * Registry of release-resource resolvers, keyed by `resource_type`.
 *
 * To support a new resource type when it is implemented, add one entry:
 *   - listNames(): returns the service listing ({ body }) used to resolve the
 *     resource display name by id. Omit if the name should not be resolved.
 *   - resolveVersionName(id, versionId): optional; returns the version label for
 *     that resource. Omit for non-versioned types (keeps the raw version id).
 *
 * Anything not registered here passes through untouched.
 */
const RESOURCE_RESOLVERS = {
  application: {
    listNames: () => edgeAppService.listEdgeApplicationsService({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await edgeAppVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  },
  firewall: {
    listNames: () => edgeFirewallService.listEdgeFirewallService({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const versions = await edgeFirewallService.listFirewallVersions(id)
      const match = (Array.isArray(versions) ? versions : []).find(
        (version) => String(version.id) === String(versionId)
      )
      return match?.comment || match?.id
    }
  },
  connector: {
    listNames: () => edgeConnectorsService.listEdgeConnectorsService({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await edgeConnectorVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  },
  function: {
    listNames: () => edgeFunctionService.listEdgeFunctionsService({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await edgeFunctionVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  },
  custom_page: {
    listNames: () => customPageService.listCustomPagesService({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await customPageVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  },
  network_list: {
    listNames: () => networkListsService.listNetworkLists({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await networkListVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  },
  waf: {
    listNames: () => wafService.listWafRules({ page: 1, pageSize: 100 }),
    resolveVersionName: async (id, versionId) => {
      const version = await wafVersionService.loadVersion(id, versionId)
      return version?.comment || version?.id
    }
  }
}

const buildNameMap = (body) =>
  new Map(
    (Array.isArray(body) ? body : []).map((item) => [String(item.id), item.name?.text ?? item.name])
  )

const loadNameMap = async (resolver) => {
  if (!resolver?.listNames) return new Map()
  try {
    const { body } = await resolver.listNames()
    return buildNameMap(body)
  } catch {
    return new Map()
  }
}

const resolveVersionName = async (resolver, id, versionId) => {
  if (!versionId || !resolver?.resolveVersionName) return versionId
  try {
    return (await resolver.resolveVersionName(id, versionId)) || versionId
  } catch {
    return versionId
  }
}

export const resolveReleaseResources = async (resources) => {
  if (!Array.isArray(resources) || !resources.length) return resources

  const typesToResolve = [
    ...new Set(
      resources
        .filter((resource) => resource?.id != null && RESOURCE_RESOLVERS[resource?.type])
        .map((resource) => resource.type)
    )
  ]
  if (!typesToResolve.length) return resources

  const nameMaps = new Map(
    await Promise.all(
      typesToResolve.map(async (type) => [type, await loadNameMap(RESOURCE_RESOLVERS[type])])
    )
  )

  return Promise.all(
    resources.map(async (resource) => {
      const resolver = resource?.id != null ? RESOURCE_RESOLVERS[resource?.type] : null
      if (!resolver) return resource

      const nameById = nameMaps.get(resource.type) ?? new Map()
      const name = nameById.get(String(resource.id)) ?? resource.name
      const versionName = await resolveVersionName(resolver, resource.id, resource.versionId)

      return { ...resource, name, versionName }
    })
  )
}
