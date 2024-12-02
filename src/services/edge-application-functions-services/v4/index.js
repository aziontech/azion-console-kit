import { listFunctionsService } from './list-edge-functions-service'
import { createFunctionService } from './create-function-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listFunctionsService} listFunctionsService - The listFunctionsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listFunctionsService, createFunctionService }
