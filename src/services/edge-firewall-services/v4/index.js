import { listEdgeFirewallService } from './list-edge-firewall-service'
import { cloneEdgeFirewallService } from './clone-edge-firewall-service'
import { createEdgeFirewallService } from './create-edge-firewall-service'
import { deleteEdgeFirewallService } from './delete-edge-firewall-service'
import { loadEdgeFirewallService } from './load-edge-firewall-service'
import { editEdgeFirewallService } from './edit-edge-firewall-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listEdgeFirewallService} listEdgeFirewallService - The listEdgeFirewallService reference
 * @property {typeof cloneEdgeFirewallService} cloneEdgeFirewallService - The cloneEdgeFirewallService reference
 * @property {typeof createEdgeFirewallService} createEdgeFirewallService - The createEdgeFirewallService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listEdgeFirewallService,
  cloneEdgeFirewallService,
  createEdgeFirewallService,
  deleteEdgeFirewallService,
  loadEdgeFirewallService,
  editEdgeFirewallService
}
