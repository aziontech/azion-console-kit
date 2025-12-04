import { listEdgeApplicationsService } from './list-edge-applications-service'
import { loadEdgeApplicationsDropdownService } from './load-edge-application-service-dropdown'
import { loadEdgeApplicationsService } from './load-edge-application-service'
import { editEdgeApplicationsService } from './edit-edge-application-service'
import { checkgeApplicationsLockedService } from './check-edge-application-locked-service'
import { listEdgeApplicationsDropdownService } from './list-edge-application-dropdown-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listEdgeApplicationsService} listEdgeApplicationsService - The listEdgeApplicationsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listEdgeApplicationsService,
  loadEdgeApplicationsDropdownService,
  loadEdgeApplicationsService,
  editEdgeApplicationsService,
  checkgeApplicationsLockedService,
  listEdgeApplicationsDropdownService
}
