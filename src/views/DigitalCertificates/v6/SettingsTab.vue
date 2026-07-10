<script setup>
  import { computed } from 'vue'
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEditDigitalCertificates from '@/views/DigitalCertificates/FormFields/FormFieldsEditDigitalCertificates.vue'
  import { documentationGuideProducts } from '@/helpers'
  import { digitalCertificatesV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-v6-service'
  import { digitalCertificatesCRLV6Service } from '@/services/v2/digital-certificates/v6/digital-certificates-crl-v6-service'

  defineOptions({ name: 'digital-certificates-settings-tab' })

  const props = defineProps({
    resource: {
      type: Object,
      required: true
    },
    resourceKind: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['updated'])

  const service = computed(() =>
    props.resourceKind === 'crl' ? digitalCertificatesCRLV6Service : digitalCertificatesV6Service
  )

  const initialValues = computed(() => ({
    name: props.resource.name,
    type: props.resource.type,
    managed: props.resource.managed === true,
    csr: props.resource.csr ?? '',
    certificate: '',
    privateKey: ''
  }))

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

  const loadService = () => initialValues.value

  const editService = (values) => service.value.edit({ id: props.resource.id, values })

  const documentationService = documentationGuideProducts.generateLetsEncryptCertificate

  const isEmptyContent = (value) =>
    value === null || value === undefined || String(value).trim() === ''

  const isUnchanged = (values = {}) => {
    const nameUnchanged = values.name === initialValues.value.name
    const certificateEmpty = isEmptyContent(values.certificate)
    const privateKeyEmpty = isEmptyContent(values.privateKey)

    return nameUnchanged && certificateEmpty && privateKeyEmpty
  }

  const handleEditSuccess = () => {
    emit('updated')
  }
</script>

<template>
  <EditFormBlock
    :editService="editService"
    :loadService="loadService"
    :initialValues="initialValues"
    :schema="validationSchema"
    isTabs
    disableRedirect
    @on-edit-success="handleEditSuccess"
  >
    <template #form>
      <FormFieldsEditDigitalCertificates
        :documentationService="documentationService"
        :isLoading="false"
      />
    </template>
    <template #action-bar="{ onSubmit, onCancel, loading, values }">
      <ActionBarTemplate
        v-if="!values.managed"
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="isUnchanged(values)"
      />
    </template>
  </EditFormBlock>
</template>
