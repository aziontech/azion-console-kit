import { listNetworkListService } from './list-network-list-service'
import { loadNetworkListService } from './load-network-list-service'
import { editNetworkListService } from './edit-network-list-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listNetworkListService} listNetworkListService - The listNetworkListService reference
 * @property {typeof loadNetworkListService} loadNetworkListService - The loadNetworkListService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listNetworkListService, loadNetworkListService, editNetworkListService }
