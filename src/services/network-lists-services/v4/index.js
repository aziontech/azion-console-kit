import { listNetworkListService } from './list-network-list-service'
import { createNetworkListService } from './create-network-list-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listNetworkListService} listNetworkListService - The listNetworkListService reference
 * @property {typeof createNetworkListService} createNetworkListService
 */

/**
 * @type {ExportedServicesType}
 */
export { listNetworkListService, createNetworkListService }
