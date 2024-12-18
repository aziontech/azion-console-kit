import { listFunctionsService } from './list-edge-functions-service'
import { listFunctionsServiceOptions } from './list-edge-functions-options-service'
import { loadFunctionService } from './load-function-instance-service'
import { editFunctionService } from './edit-function-instance-service'
import { createFunctionService } from './create-function-service'
import { deleteFunctionService } from './delete-function-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listFunctionsService} listFunctionsService - The listFunctionsService reference
 * @property {typeof listFunctionsServiceOptions} listFunctionsServiceOptions - The listFunctionsServiceOptions reference
 */

/**
 * @type {ExportedServicesType}
 */

export {
  listFunctionsService,
  loadFunctionService,
  editFunctionService,
  createFunctionService,
  deleteFunctionService,
  listFunctionsServiceOptions
}
