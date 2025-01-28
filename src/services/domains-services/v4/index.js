import { listDomainsService } from './list-domain-service'
import { loadDomainService } from './load-domain-service'
import { editDomainService } from './edit-domain-service'
import { createDomainService } from './create-domain-service'
import { deleteDomainService } from './delete-domain-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDomainsService} listDomainsService - The listDomainsService reference
 * @property {typeof createDomainService} createDomainService - The createDomainService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listDomainsService,
  loadDomainService,
  editDomainService,
  createDomainService,
  deleteDomainService
}
