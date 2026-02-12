<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="certificateName"
        description="Configure certificate data, validation methods, and lifecycle settings used to secure traffic."
      ></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editServiceRender"
        :loadService="loadServiceRender"
        :schema="validationSchema"
        updatedRedirect="list-digital-certificates"
        @loaded-service-object="setCertificateName"
        @on-edit-success="handleTrackSuccessEdit"
        @on-edit-fail="handleTrackFailEdit"
      >
        <template #form>
          <FormFieldsEditDigitalCertificates
            :clipboardWrite="props.clipboardWrite"
            :documentationService="props.documentationService"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarBlockWithTeleport
            v-if="!values.managed"
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEditDigitalCertificates from './FormFields/FormFieldsEditDigitalCertificates.vue'
  import * as yup from 'yup'
  import { inject, computed, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import { digitalCertificatesService } from '@/services/v2/digital-certificates/digital-certificates-service'
  import { digitalCertificatesCRLService } from '@/services/v2/digital-certificates/digital-certificates-crl-service'
  import { useDigitalCertificate } from './FormFields/composables/certificate'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const certificateName = ref('Edit Digital Certificate')

  const setCertificateName = (certificate) => {
    certificateName.value = certificate.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, certificate.name)
  }

  const props = defineProps({
    clipboardWrite: {
      type: Function,
      required: true
    },
    documentationService: {
      required: true,
      type: Function
    }
  })

  const { certificateTypeList } = useDigitalCertificate()

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field.'),
    type: yup.string(),
    csr: yup.string(),
    certificate: yup.string().nullable(),
    privateKey: yup.string().nullable(),
    managed: yup
      .boolean()
      .isFalse(
        `This is a Let's Encrypt™ certificate automatically created and managed by Azion and can't be edited.`
      )
  })

  const handleTrackSuccessEdit = () => {
    tracker.product
      .productEdited({
        productName: 'Digital Certificate'
      })
      .track()
  }

  const handleTrackFailEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Digital Certificate',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const editServiceRender = computed(() => {
    return certificateTypeList.value === 'Certificates'
      ? digitalCertificatesService.editDigitalCertificate
      : digitalCertificatesCRLService.editDigitalCertificateCRL
  })

  const loadServiceRender = computed(() => {
    return certificateTypeList.value === 'Certificates'
      ? digitalCertificatesService.loadDigitalCertificate
      : digitalCertificatesCRLService.loadDigitalCertificateCRL
  })
</script>
