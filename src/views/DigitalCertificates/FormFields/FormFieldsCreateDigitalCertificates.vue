<template>
  <GeneralBlock />

  <ImportRequestCertificate v-if="isRenderImportRequestCertificate" />

  <ImportServerCertificate v-if="isRenderImportServerCertificate" />

  <RequestCertificate v-if="isRenderRequestCertificate" />
</template>

<script setup>
  import { computed } from 'vue'
  import GeneralBlock from './blocks/General.vue'
  import ImportRequestCertificate from './blocks/ImportRequestCertificate.vue'
  import ImportServerCertificate from './blocks/ImportServerCertificate.vue'
  import RequestCertificate from './blocks/RequestCertificate.vue'
  import { useDigitalCertificate } from './composables/certificate'

  defineOptions({ name: 'FormFieldsCreateDigitalCertificates' })

  const {
    isEdgeCertificate,
    isEdgeCertificateCSR,
    isTrustedCertificate,
    isCertificateRevocationList
  } = useDigitalCertificate()

  const isRenderImportRequestCertificate = computed(() => {
    return isEdgeCertificate.value || isEdgeCertificateCSR.value
  })

  const isRenderRequestCertificate = computed(() => {
    return isEdgeCertificateCSR.value
  })

  const isRenderImportServerCertificate = computed(() => {
    return (
      isEdgeCertificate.value || isTrustedCertificate.value || isCertificateRevocationList.value
    )
  })
</script>
