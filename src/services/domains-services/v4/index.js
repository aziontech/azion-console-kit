import { listDomainsService } from './list-domain-service'
import { createDomainService } from './create-domain-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDomainsService} listDomainsService - The listDomainsService reference
 * @property {typeof createDomainService} createDomainService - The createDomainService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listDomainsService, createDomainService }
