import { ref } from 'vue'
import { rulesEngineService } from '@/services/v2/edge-app/edge-app-rules-engine-service'
import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

const CONNECTOR_MANIFEST_LOADERS = {
  application: (parentId, versionId) =>
    rulesEngineService.listConnectorDependenciesByVersion(parentId, versionId),
  custom_page: (parentId, versionId) =>
    customPageVersionService.listConnectorDependenciesByVersion(parentId, versionId)
}

const toConnectorIdSet = (dependencies) => {
  const ids = new Set()
  ;(Array.isArray(dependencies) ? dependencies : []).forEach((dependency) => {
    if (dependency?.connectorId != null) ids.add(String(dependency.connectorId))
  })
  return ids
}

export function useScopedConnectorAttribution() {
  const ownedConnectorIdsByDs = ref({})
  const loadingByDs = ref({})
  const errorByDs = ref({})
  const loadedKeyByDs = ref({})

  const ensure = async (dsId, { scopedType, parentId, versionId } = {}) => {
    if (dsId == null) return
    const loader = CONNECTOR_MANIFEST_LOADERS[scopedType]
    if (!loader || parentId == null || versionId == null) return

    const key = `${scopedType}:${parentId}:${versionId}`
    if (loadingByDs.value[dsId]) return
    if (loadedKeyByDs.value[dsId] === key && !errorByDs.value[dsId]) return

    loadingByDs.value = { ...loadingByDs.value, [dsId]: true }
    errorByDs.value = { ...errorByDs.value, [dsId]: false }
    try {
      const dependencies = await loader(parentId, versionId)
      ownedConnectorIdsByDs.value = {
        ...ownedConnectorIdsByDs.value,
        [dsId]: toConnectorIdSet(dependencies)
      }
      loadedKeyByDs.value = { ...loadedKeyByDs.value, [dsId]: key }
    } catch (error) {
      errorByDs.value = { ...errorByDs.value, [dsId]: true }
      loadedKeyByDs.value = { ...loadedKeyByDs.value, [dsId]: null }
      // eslint-disable-next-line no-console
      console.error('useScopedConnectorAttribution: failed to load connector manifest', error)
    } finally {
      loadingByDs.value = { ...loadingByDs.value, [dsId]: false }
    }
  }

  const ownedConnectorIdsFor = (dsId) => ownedConnectorIdsByDs.value[dsId] ?? null
  const isResolving = (dsId) => Boolean(loadingByDs.value[dsId])
  const hasError = (dsId) => Boolean(errorByDs.value[dsId])

  return {
    ownedConnectorIdsByDs,
    ensure,
    ownedConnectorIdsFor,
    isResolving,
    hasError
  }
}
