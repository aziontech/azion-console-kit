import { ref, computed, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const isFirstLoadData = ref(true)

export function useDigitalCertificate(initialType = null) {
  const route = useRoute()
  const router = useRouter()

  if (initialType && sharedCertificateType.value !== initialType) {
    sharedCertificateType.value = initialType
  }

  if (route.query.certificate && sharedCertificateType.value !== route.query.certificate) {
    sharedCertificateType.value = route.query.certificate
  }

  const certificateType = sharedCertificateType
  const certificateTypeList = sharedCertificateTypeList

  const handleClickToCreate = (certificate) => {
    if (certificate === CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST) {
      certificateType.value = CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST
      certificateTypeList.value = 'CRL'
      navigateToCreate()
    }

    certificateType.value = certificate
    certificateTypeList.value = 'Certificates'
    navigateToCreate()
  }

  const navigateToCreate = () => {
    router.push({
      path: '/digital-certificates/create',
      query: {
        certificate: certificateType.value
      }
    })
  }

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
      case 'CRL':
        return digitalCertificatesCRLService.listDigitalCertificatesCRL
      default:
        return digitalCertificatesService.listDigitalCertificates
    }
  })

  const deleteService = computed(() => {
    switch (certificateTypeList.value) {
      case 'CRL':
        return digitalCertificatesCRLService.deleteDigitalCertificateCRL
      default:
        return digitalCertificatesService.deleteDigitalCertificate
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

  const pageTitleByCertificateType = computed(() => {
    if (certificateType.value === CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST) {
      return 'Importing a Certificate Revogation List'
    }

    if (certificateType.value === CERTIFICATE_TYPES.TRUSTED) {
      return 'Importing a Trusted Certificate'
    }

    return 'Create Server Certificate'
  })

  const setFirstLoadData = (value) => {
    isFirstLoadData.value = value
  }

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
    certificateTypeList,
    pageTitleByCertificateType,
    handleClickToCreate,
    deleteService,
    firstLoadData: readonly(isFirstLoadData),
    setFirstLoadData
  }
}
