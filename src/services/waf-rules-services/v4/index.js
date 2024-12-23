import { listWafRulesService } from './list-waf-rules-service'
import { cloneWafRulesService } from './clone-waf-rules-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listWafRulesService } listWafRulesService  - The listWafRulesService  reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listWafRulesService, cloneWafRulesService }
