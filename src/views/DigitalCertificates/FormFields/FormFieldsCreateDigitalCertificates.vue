<template>
  <GeneralBlock :isDrawer="isDrawer" />

  <ImportRequestCertificate
    v-if="isRenderImportRequestCertificate"
    :isDrawer="isDrawer"
  />

  <ImportServerCertificate
    v-if="isRenderImportServerCertificate"
    :isDrawer="isDrawer"
  />

  <RequestCertificate
    v-if="isRenderRequestCertificate"
    :isDrawer="isDrawer"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import GeneralBlock from './blocks/General.vue'
  import ImportRequestCertificate from './blocks/ImportRequestCertificate.vue'
  import ImportServerCertificate from './blocks/ImportServerCertificate.vue'
  import RequestCertificate from './blocks/RequestCertificate.vue'
  import { useDigitalCertificate } from './composables/certificate'

  defineOptions({ name: 'FormFieldsCreateDigitalCertificates' })

  defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })

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
