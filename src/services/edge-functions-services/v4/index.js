import { listEdgeFunctionsService } from './list-edge-functions-service'
import { listEdgeFunctionsDropdownService } from './list-edge-functions-dropdown-service'
import { loadEdgeFunctionService } from './load-edge-function-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listEdgeFunctionsService} listEdgeFunctionsService - The listEdgeFunctionsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listEdgeFunctionsService, listEdgeFunctionsDropdownService, loadEdgeFunctionService }
