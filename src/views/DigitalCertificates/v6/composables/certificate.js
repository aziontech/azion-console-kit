import { ref, computed, readonly } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  CERTIFICATE_TYPES,
  PRIVATE_KEY_TYPES
} from '@/views/DigitalCertificates/FormFields/composables/certificate'
import { digitalCertificatesV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-service'
import { digitalCertificatesCRLV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-service'
import { digitalCertificatesCSRService } from '@/services/v2/digital-certificates/digital-certificates-csr-service'

export { CERTIFICATE_TYPES, PRIVATE_KEY_TYPES }

const sharedCertificateType = ref(CERTIFICATE_TYPES.EDGE_CERTIFICATE)
const sharedCertificateTypeList = ref('Certificates')
const isFirstLoadData = ref(true)

export function useDigitalCertificateV6(initialType = null) {
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
        return digitalCertificatesCRLV6Service.create
      default:
        return digitalCertificatesV6Service.create
    }
  })

  const listService = computed(() => {
    switch (certificateTypeList.value) {
      case 'CRL':
        return digitalCertificatesCRLV6Service.list
      default:
        return digitalCertificatesV6Service.list
    }
  })

  const deleteService = computed(() => {
    switch (certificateTypeList.value) {
      case 'CRL':
        return digitalCertificatesCRLV6Service.delete
      default:
        return digitalCertificatesV6Service.delete
    }
  })

  const editPagePath = computed(() => {
    return certificateTypeList.value === 'CRL'
      ? '/digital-certificates/edit-crl'
      : '/digital-certificates/edit'
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
    deleteService,
    editPagePath,
    isEdgeCertificate,
    isEdgeCertificateCSR,
    isTrustedCertificate,
    isCertificateRevocationList,
    CERTIFICATE_TYPES,
    PRIVATE_KEY_TYPES,
    certificateTypeList,
    pageTitleByCertificateType,
    handleClickToCreate,
    firstLoadData: readonly(isFirstLoadData),
    setFirstLoadData
  }
}
