import { versionedFirewallFunctionService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-function-service'
import { versionedFirewallRulesEngineService } from '@/services/v2/edge-firewall/versioned/versioned-firewall-rules-engine-service'

/**
 * Builds one facade per Edge Firewall versioned sub-resource, each pre-bound to a
 * `(resourceId, versionId)` pair and delegating to the versioned services.
 *
 * Method signatures mirror how the existing Functions / Rules Engine ListViews
 * already call `props.service.*`, so the shared components stay drop-in (no fork).
 *
 * @param {string|number} resourceId Edge Firewall id.
 * @param {string} versionId Version id the tabs are scoped to.
 * @returns {{ functions: object, rulesEngine: object }}
 */
export const useVersionedFacades = (resourceId, versionId) => {
  const functions = {
    list: (query) => versionedFirewallFunctionService.list(resourceId, versionId, query),
    load: ({ functionID }) =>
      versionedFirewallFunctionService.load(resourceId, versionId, functionID),
    create: (payload) => versionedFirewallFunctionService.create(resourceId, versionId, payload),
    edit: (payload) => versionedFirewallFunctionService.edit(resourceId, versionId, payload),
    remove: (functionId) =>
      versionedFirewallFunctionService.remove(resourceId, versionId, functionId)
  }

  const rulesEngine = {
    listEdgeFirewallRulesEngineService: (params) =>
      versionedFirewallRulesEngineService.listEdgeFirewallRulesEngineService({
        ...params,
        versionId
      }),
    createEdgeFirewallRulesEngineService: (firewallId, payload) =>
      versionedFirewallRulesEngineService.createEdgeFirewallRulesEngineService(
        firewallId,
        payload,
        versionId
      ),
    editEdgeFirewallRulesEngineService: (firewallId, payload) =>
      versionedFirewallRulesEngineService.editEdgeFirewallRulesEngineService(
        firewallId,
        payload,
        versionId
      ),
    loadEdgeFirewallRulesEngineService: ({ edgeFirewallId, id }) =>
      versionedFirewallRulesEngineService.loadEdgeFirewallRulesEngineService({
        edgeFirewallId,
        id,
        versionId
      }),
    reorderEdgeFirewallRulesEngineService: (payload, firewallId) =>
      versionedFirewallRulesEngineService.reorderEdgeFirewallRulesEngineService(
        payload,
        firewallId,
        versionId
      ),
    deleteEdgeFirewallRulesEngineService: (firewallId, ruleEngineId) =>
      versionedFirewallRulesEngineService.deleteEdgeFirewallRulesEngineService(
        firewallId,
        ruleEngineId,
        versionId
      )
  }

  return { functions, rulesEngine }
}
