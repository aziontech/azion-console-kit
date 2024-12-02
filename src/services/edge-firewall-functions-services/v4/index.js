import { listFunctionsService } from './list-functions-service'
import { createFunctionService } from './create-function-service'
import { deleteFunctionService } from './delete-function-service'
import { loadFunctionService } from './load-function-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listFunctionsService} listFunctionsService - The listFunctionsService reference
 * @property {typeof createFunctionService} createFunctionService - The createFunctionService reference
 * @property {typeof deleteFunctionService} deleteFunctionService - The deleteFunctionService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listFunctionsService, createFunctionService, deleteFunctionService, loadFunctionService }
