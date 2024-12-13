import { listWafRulesService } from './list-waf-rules-service'
import { cloneWafRulesService } from './clone-waf-rules-service'
import { createWafRulesService } from './create-waf-rules-service'
import { deleteWafRulesService } from './delete-waf-rules-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listWafRulesService } listWafRulesService  - The listWafRulesService  reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listWafRulesService, cloneWafRulesService, createWafRulesService, deleteWafRulesService }
