import { ref, computed } from 'vue'
import {
  digitalCertificatesService,
  digitalCertificatesCSRService,
  digitalCertificatesCRLService
} from '@/services/v2'

export const CERTIFICATE_TYPES = {
  EDGE_CERTIFICATE: 'edge_certificate',
  EDGE_CERTIFICATE_CSR: 'generateCSR',
  TRUSTED: 'trusted_ca_certificate',
  CERTIFICATE_REVOCATION_LIST: 'certificateRevogationList'
}

export const PRIVATE_KEY_TYPES = {
  RSA_2048: 'RSA (2048)',
  RSA_4096: 'RSA (4096)',
  ECDSA_P256: 'ECDSA P-256',
  ECDSA_P384: 'ECDSA P-384'
}

const sharedCertificateType = ref(CERTIFICATE_TYPES.EDGE_CERTIFICATE)
const sharedCertificateTypeList = ref('Certificates')

export function useDigitalCertificate() {
  const certificateType = sharedCertificateType
  const certificateTypeList = sharedCertificateTypeList

  const createService = computed(() => {
    switch (certificateType.value) {
      case CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR:
        return digitalCertificatesCSRService.createDigitalCertificateCSR
      case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
        return digitalCertificatesCRLService.createDigitalCertificateCRL
      default:
        return digitalCertificatesService.createDigitalCertificate
    }
  })

  const listService = computed(() => {
    switch (certificateTypeList.value) {
      case 'Certificates':
        return digitalCertificatesService.listDigitalCertificates
      case 'CRL':
        return digitalCertificatesCRLService.listDigitalCertificatesCRL
      default:
        return digitalCertificatesService.listDigitalCertificates
    }
  })

  const isEdgeCertificate = computed(
    () => certificateType.value === CERTIFICATE_TYPES.EDGE_CERTIFICATE
  )

  const isEdgeCertificateCSR = computed(
    () => certificateType.value === CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR
  )

  const isTrustedCertificate = computed(() => certificateType.value === CERTIFICATE_TYPES.TRUSTED)

  const isCertificateRevocationList = computed(
    () => certificateType.value === CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST
  )

  return {
    certificateType,
    createService,
    listService,
    isEdgeCertificate,
    isEdgeCertificateCSR,
    isTrustedCertificate,
    isCertificateRevocationList,
    CERTIFICATE_TYPES,
    PRIVATE_KEY_TYPES,
    certificateTypeList
  }
}
