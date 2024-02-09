import { listEdgeApplicationsService } from './list-edge-applications-service'
import { deleteEdgeApplicationService } from './delete-edge-application-service'
import { createEdgeApplicationService } from './create-edge-application-service'
import { loadEdgeApplicationService } from './load-edge-application-service'
import { editEdgeApplicationService } from './edit-edge-application-service'
import { contactSalesEdgeApplicationService } from './contact-sales-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof loadEdgeApplicationService} loadEdgeApplicationService - The loadEdgeApplicationService reference
 * @property {typeof editEdgeApplicationService} editEdgeApplicationService - The editEdgeApplicationService reference
 * @property {typeof listEdgeApplicationsService} listEdgeApplicationsService - The listEdgeApplicationsService reference
 * @property {typeof deleteEdgeApplicationService} deleteEdgeApplicationService - The deleteEdgeApplicationService reference
 * @property {typeof createEdgeApplicationService} createEdgeApplicationService - The createEdgeApplicationService reference
 * @property {typeof contactSalesEdgeApplicationService} contactSalesEdgeApplicationService - The contactSalesEdgeApplicationService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  loadEdgeApplicationService,
  editEdgeApplicationService,
  listEdgeApplicationsService,
  deleteEdgeApplicationService,
  createEdgeApplicationService,
  contactSalesEdgeApplicationService
}
