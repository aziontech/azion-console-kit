<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="pageTitleByCertificateType"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleSuccessResponse"
        @on-response-fail="handleTrackFailCreated"
        disableToast
      >
        <template #form>
          <InlineMessage :show="isRenderInlineMessage" />

          <FormFieldsCreateDigitalCertificates />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import InlineMessage from './FormFields/InlineMessage.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCreateDigitalCertificates from './FormFields/FormFieldsCreateDigitalCertificates.vue'
  import { ref, computed, inject } from 'vue'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import validationSchemaHandler from './FormFields/composables/validation'
  import { useDigitalCertificate } from './FormFields/composables/certificate'
  import { useRoute } from 'vue-router'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()

  const {
    createService,
    isEdgeCertificate,
    isEdgeCertificateCSR,
    PRIVATE_KEY_TYPES,
    CERTIFICATE_TYPES,
    certificateTypeList,
    pageTitleByCertificateType
  } = useDigitalCertificate(route.query.certificate)

  const validationSchema = validationSchemaHandler(false, CERTIFICATE_TYPES.EDGE_CERTIFICATE)

  const initialValues = ref({
    digitalCertificateName: '',
    certificate: '',
    privateKey: undefined,
    common: '',
    country: '',
    state: '',
    city: '',
    organization: '',
    organizationUnity: '',
    email: '',
    privateKeyType: PRIVATE_KEY_TYPES.RSA_2048,
    subjectAlternativeNames: '',
    certificateType: CERTIFICATE_TYPES.EDGE_CERTIFICATE
  })

  const handleTrackSuccessCreated = () => {
    tracker.product.productCreated({
      productName: 'Digital Certificate'
    })
  }

  const handleTrackFailCreated = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Digital Certificate',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleSuccessResponse = (response) => {
    handleTrackSuccessCreated()
    handleToast(response)
  }

  const handleToast = (response) => {
    const label =
      certificateTypeList.value === 'Certificates' ? 'View Edge Certificate' : 'View CRL'

    const toast = {
      feedback: 'Your digital certificate has been created!',
      actions: {
        link: {
          label,
          callback: () => response.redirectToUrl(`/digital-certificates/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const isRenderInlineMessage = computed(() => {
    return isEdgeCertificate.value || isEdgeCertificateCSR.value
  })
</script>
