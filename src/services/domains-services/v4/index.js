import { listDomainsService } from './list-domain-service'
import { loadDomainService } from './load-domain-service'
import { editDomainService } from './edit-domain-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDomainsService} listDomainsService - The listDomainsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listDomainsService, loadDomainService, editDomainService }
