import { ref, watch, toValue } from 'vue'
import { environmentService } from '@/services/v2/environment/environment-service'
import { deploymentService } from '@/services/v2/deployment/deployment-service'
import { RESOURCE_CATALOG_REGISTRY } from '@/services/v2/deployment/resource-catalog-registry'

const fromCatalog = (type) => async () => ({
  body: await RESOURCE_CATALOG_REGISTRY[type].listCatalog()
})

const LOADERS = {
  environment: () => environmentService.listEnvironmentsService(),
  deployment: () => deploymentService.listDeploymentsService(),
  application: fromCatalog('application'),
  firewall: fromCatalog('firewall')
}

export function useScopeNames(scopes) {
  const namesByType = ref({})

  const resolve = async () => {
    const list = toValue(scopes) ?? []
    const pendingTypes = [
      ...new Set(
        list.map((scope) => scope?.type).filter((type) => LOADERS[type] && !namesByType.value[type])
      )
    ]

    for (const type of pendingTypes) {
      try {
        const { body } = await LOADERS[type]()
        const map = {}
        for (const item of body ?? []) {
          map[item.id] = item.name ?? ''
        }
        namesByType.value = { ...namesByType.value, [type]: map }
      } catch {
        namesByType.value = { ...namesByType.value, [type]: {} }
      }
    }
  }

  watch(() => toValue(scopes), resolve, { immediate: true, deep: true })

  const resolveName = (scope) => {
    if (!scope || scope.type === 'global') return ''
    const id = scope[`${scope.type}_id`]
    return namesByType.value[scope.type]?.[id] ?? scope.name ?? ''
  }

  return { resolveName }
}
