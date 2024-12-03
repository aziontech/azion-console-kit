import { listFunctionsService } from './list-edge-functions-service'
import { createFunctionService } from './create-function-service'
import { deleteFunctionService } from './delete-function-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listFunctionsService} listFunctionsService - The listFunctionsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listFunctionsService, createFunctionService, deleteFunctionService }
