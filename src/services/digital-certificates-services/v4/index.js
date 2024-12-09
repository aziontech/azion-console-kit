import { listDigitalCertificatesServiceDropdown } from './list-digital-certificates-dropdown-service'
import { listDigitalCertificatesService } from './list-digital-certificates-service'
import { createDigitalCertificatesCSRService } from './create-digital-certificates-csr-service'
import { createDigitalCertificatesService } from './create-digital-certificates-services'
import { loadDigitalCertificateService } from './load-digital-certificates-service'
import { editDigitalCertificateService } from './edit-digital-certificates-service'
import { deleteDigitalCertificatesService } from './delete-digital-certificates-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDigitalCertificatesService} listDigitalCertificatesService - The listDigitalCertificatesService reference
 * @property {typeof createDigitalCertificatesCSRService} createDigitalCertificatesCSRService - The createDigitalCertificatesCSRService reference
 * @property {typeof createDigitalCertificatesService} createDigitalCertificatesService - The createDigitalCertificatesService reference
 * @property {typeof loadDigitalCertificateService} loadDigitalCertificateService - The loadDigitalCertificateService reference
 * @property {typeof editDigitalCertificateService} editDigitalCertificateService - The editDigitalCertificateService reference
 * @property {typeof deleteDigitalCertificatesService} deleteDigitalCertificatesService - The deleteDigitalCertificatesService reference

/**
 * @type {ExportedServicesType}
 */
export {
  listDigitalCertificatesService,
  createDigitalCertificatesCSRService,
  createDigitalCertificatesService,
  loadDigitalCertificateService,
  editDigitalCertificateService,
  deleteDigitalCertificatesService,
  listDigitalCertificatesServiceDropdown
}
