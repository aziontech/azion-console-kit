import { listNetworkListService } from './list-network-list-service'
import { deleteNetworkListService } from './delete-network-list-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listNetworkListService} listNetworkListService - The listNetworkListService reference
 * @property {typeof deleteNetworkListService} deleteNetworkListService - The deleteNetworkListService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listNetworkListService, deleteNetworkListService }
