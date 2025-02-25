import { listEdgeApplicationsService } from './list-edge-applications-service'
import { cloneEdgeApplicationService } from './clone-edge-application-service'
import { deleteEdgeApplicationService } from './delete-edge-application-service'
import { loadEdgeApplicationsDropdownService } from './load-edge-application-service-dropdown'
import { createEdgeApplicationService } from './create-edge-application-service'
import { loadEdgeApplicationsService } from './load-edge-application-service'
import { editEdgeApplicationsService } from './edit-edge-application-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listEdgeApplicationsService} listEdgeApplicationsService - The listEdgeApplicationsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listEdgeApplicationsService,
  cloneEdgeApplicationService,
  deleteEdgeApplicationService,
  loadEdgeApplicationsDropdownService,
  createEdgeApplicationService,
  loadEdgeApplicationsService,
  editEdgeApplicationsService
}
