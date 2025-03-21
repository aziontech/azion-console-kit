import { listNetworkListService } from './list-network-list-service'
import { createNetworkListService } from './create-network-list-service'
import { deleteNetworkListService } from './delete-network-list-service'
import { loadNetworkListService } from './load-network-list-service'
import { editNetworkListService } from './edit-network-list-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listNetworkListService} listNetworkListService - The listNetworkListService reference
 * @property {typeof createNetworkListService} createNetworkListService
 * @property {typeof deleteNetworkListService} deleteNetworkListService - The deleteNetworkListService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listNetworkListService,
  deleteNetworkListService,
  loadNetworkListService,
  createNetworkListService,
  editNetworkListService
}
