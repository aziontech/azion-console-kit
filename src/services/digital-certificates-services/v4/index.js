import { listDigitalCertificatesService } from './list-digital-certificates-service'
import { deleteDigitalCertificatesService } from './delete-digital-certificates-service'
/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDigitalCertificatesService} listDigitalCertificatesService - The listDigitalCertificatesService reference
 * @property {typeof deleteDigitalCertificatesService} deleteDigitalCertificatesService - The deleteDigitalCertificatesService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listDigitalCertificatesService, deleteDigitalCertificatesService }
