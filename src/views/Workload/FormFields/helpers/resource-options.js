import { ref } from 'vue'
import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
import { customPageService } from '@/services/v2/custom-page/custom-page-service'

const noopListService = async () => ({ body: [], count: 0 })

// API returns resource type identifiers in snake_case (e.g. `custom_page`, `network_list`),
// while `resourcePackTypeMeta` and `RESOURCE_SERVICES` use camelCase. Normalize at the boundary.
const API_KEY_TO_CANONICAL = {
  custom_page: 'customPage',
  network_list: 'networkList'
}

export const toCanonicalResourceKey = (key) => API_KEY_TO_CANONICAL[key] ?? key

const RESOURCE_SERVICES = {
  application: { list: edgeAppService.listEdgeApplicationsServiceDropdown },
  firewall: { list: edgeFirewallService.listEdgeFirewallServiceDropdown },
  customPage: { list: customPageService.listCustomPagesService },
  function: { list: noopListService },
  networkList: { list: noopListService }
}

export function useResourceOptions() {
  const resourceOptions = ref({})
  const resourceLoading = ref({})

  const ensureResourceOptions = async (rawKey) => {
    const key = toCanonicalResourceKey(rawKey)
    if (resourceOptions.value[key] || resourceLoading.value[key]) return
    const listService = RESOURCE_SERVICES[key]?.list
    if (!listService) {
      resourceOptions.value = { ...resourceOptions.value, [key]: [] }
      return
    }
    resourceLoading.value = { ...resourceLoading.value, [key]: true }
    try {
      // pageSize defaults to 10 in the v2 list services — bump it so the dropdown
      // surfaces every resource the user owns, not just the first page. 100 matches
      // the convention used by other dropdowns in this codebase (e.g. certificates).
      const response = await listService({
        fields: ['id', 'name'],
        active: true,
        page: 1,
        pageSize: 100
      })
      const body = Array.isArray(response?.body) ? response.body : []
      resourceOptions.value = { ...resourceOptions.value, [key]: body }
    } catch {
      resourceOptions.value = { ...resourceOptions.value, [key]: [] }
    } finally {
      resourceLoading.value = { ...resourceLoading.value, [key]: false }
    }
  }

  const optionsForResource = (rawKey) => resourceOptions.value[toCanonicalResourceKey(rawKey)] ?? []

  return { optionsForResource, ensureResourceOptions, resourceLoading }
}
