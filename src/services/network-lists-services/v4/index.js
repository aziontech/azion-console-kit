import { listNetworkListService } from './list-network-list-service'
import { loadNetworkListService } from './load-network-list-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listNetworkListService} listNetworkListService - The listNetworkListService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listNetworkListService, loadNetworkListService }
