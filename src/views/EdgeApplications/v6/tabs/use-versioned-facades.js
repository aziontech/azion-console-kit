import { versionedCacheSettingsService } from '@/services/v2/edge-app/versioned/versioned-cache-settings-service'
import { versionedDeviceGroupService } from '@/services/v2/edge-app/versioned/versioned-device-group-service'
import { versionedFunctionService } from '@/services/v2/edge-app/versioned/versioned-function-service'
import { versionedRulesEngineService } from '@/services/v2/edge-app/versioned/versioned-rules-engine-service'

/**
 * Builds one facade per Edge Application sub-resource, each pre-bound to a
 * `(resourceId, versionId)` pair and delegating to the versioned services.
 *
 * Method signatures intentionally mirror how each ListView/Drawer already calls
 * `props.service.*` (those components were refactored first), so the leading
 * `edgeApplicationId` some of them pass is dropped in favor of the closed-over ids.
 *
 * @param {string|number} resourceId Edge Application id.
 * @param {string|number} versionId  Version id the tabs are scoped to.
 * @returns {{ cacheSettings: object, deviceGroups: object, functions: object, rulesEngine: object }}
 */
export const useVersionedFacades = (resourceId, versionId) => {
  const buildAppIdLeadingFacade = (svc) => ({
    list: (query) => svc.list(resourceId, versionId, query),
    load: (_edgeApplicationId, id) => svc.load(resourceId, versionId, id),
    create: (_edgeApplicationId, payload) => svc.create(resourceId, versionId, payload),
    edit: (_edgeApplicationId, payload) => svc.edit(resourceId, versionId, payload),
    remove: (id) => svc.remove(resourceId, versionId, id)
  })

  const rulesEngine = {
    listRulesEngineRequestAndResponsePhase: ({ edgeApplicationId, params }) =>
      versionedRulesEngineService.listRulesEngineRequestAndResponsePhase({
        edgeApplicationId,
        versionId,
        params
      }),
    createRulesEngine: (payload) =>
      versionedRulesEngineService.createRulesEngine({ ...payload, versionId }),
    editRulesEngine: ({ edgeApplicationId, payload, reorder }) =>
      versionedRulesEngineService.editRulesEngine({
        edgeApplicationId,
        versionId,
        payload,
        reorder
      }),
    deleteRulesEngine: ({ edgeApplicationId, ruleId, phase }) =>
      versionedRulesEngineService.deleteRulesEngine({
        edgeApplicationId,
        versionId,
        ruleId,
        phase
      }),
    reorderRulesEngine: (newOrderData, edgeApplicationId) =>
      versionedRulesEngineService.reorderRulesEngine(newOrderData, edgeApplicationId, versionId),
    loadRulesEngine: ({ edgeApplicationId, id, phase, ...rest }) =>
      versionedRulesEngineService.loadRulesEngine({
        ...rest,
        edgeApplicationId,
        versionId,
        id,
        phase
      })
  }

  return {
    cacheSettings: buildAppIdLeadingFacade(versionedCacheSettingsService),

    deviceGroups: {
      ...buildAppIdLeadingFacade(versionedDeviceGroupService),
      create: (payload) => versionedDeviceGroupService.create(resourceId, versionId, payload)
    },

    functions: {
      list: (query) => versionedFunctionService.list(resourceId, versionId, query),
      load: ({ functionID }) => versionedFunctionService.load(resourceId, versionId, functionID),
      create: (payload) => versionedFunctionService.create(resourceId, versionId, payload),
      edit: (payload) => versionedFunctionService.edit(resourceId, versionId, payload),
      remove: (functionId) => versionedFunctionService.remove(resourceId, versionId, functionId)
    },

    rulesEngine
  }
}
