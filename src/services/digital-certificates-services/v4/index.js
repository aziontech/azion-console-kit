import { listDigitalCertificatesService } from './list-digital-certificates-service'
import { createDigitalCertificatesCSRService } from './create-digital-certificates-csr-service'
import { createDigitalCertificatesService } from './create-digital-certificates-services'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDigitalCertificatesService} listDigitalCertificatesService - The listDigitalCertificatesService reference
 * @property {typeof createDigitalCertificatesCSRService} createDigitalCertificatesCSRService - The createDigitalCertificatesCSRService reference
 * @property {typeof createDigitalCertificatesService} createDigitalCertificatesService - The createDigitalCertificatesService reference
 
*/

/**
 * @type {ExportedServicesType}
 */
export {
  listDigitalCertificatesService,
  createDigitalCertificatesCSRService,
  createDigitalCertificatesService
}
