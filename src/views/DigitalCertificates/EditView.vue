<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Digital Certificate"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editDigitalCertificateService"
        :loadService="props.loadDigitalCertificateService"
        :schema="validationSchema"
        :updatedRedirect="props.updatedRedirect"
      >
        <template #form>
          <FormFieldsEditDigitalCertificates :clipboardWrite="clipboardWrite" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
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
  import ActionBarBlockWithTeleport from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsEditDigitalCertificates from './FormFields/FormFieldsEditDigitalCertificates.vue'
  import * as yup from 'yup'

  const props = defineProps({
    loadDigitalCertificateService: {
      type: Function,
      required: true
    },
    editDigitalCertificateService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field.'),
    certificateType: yup.string(),
    csr: yup.string(),
    certificate: yup.string(),
    privateKey: yup.string()
  })
</script>
