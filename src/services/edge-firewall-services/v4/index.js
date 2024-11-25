import { listEdgeFirewallService } from './list-edge-firewall-service'
import { cloneEdgeFirewallService } from './clone-edge-firewall-service'
import { loadEdgeFirewallService } from './load-edge-firewall-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listEdgeFirewallService} listEdgeFirewallService - The listEdgeFirewallService reference
 * @property {typeof loadEdgeFirewallService} loadEdgeFirewallService - The loadEdgeFirewallService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listEdgeFirewallService, cloneEdgeFirewallService, loadEdgeFirewallService }
