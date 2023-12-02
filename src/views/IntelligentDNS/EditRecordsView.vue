<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Intelligent DNS Record"> </PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editRecordServiceWithIDNSIdDecorator"
        :loadService="loadRecordServiceWithIDNSIdDecorator"
        :initialValues="initialValues"
        :disableRedirect="true"
        :schema="validationSchema"
        @on-edit-success="handleEditSuccess"
      >
        <template #form>
          <FormFieldsRecords></FormFieldsRecords>
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import EditFormBlock from '@templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@templates/page-heading-block'
  import FormFieldsRecords from './FormFields/FormFieldsRecords.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'
  import router from '@/router'

  const props = defineProps({
    editRecordsService: {
      type: Function,
      required: true
    },
    loadRecordsService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const route = useRoute()

  const validationSchema = yup.object({
    name: yup.string().required(),
    selectedRecordType: yup.string().required('Please select an option'),
    value: yup.string().required(),
    ttl: yup.number().required(),
    selectedPolicy: yup.string().required('Please select an option'),
    weight: yup.number().when('policy', {
      is: 'weighted',
      then: (schema) => schema.required('Weighted is a required field').min(1).max(255)
    }),
    description: yup.string()
  })

  const initialValues = {
    intelligentDNSId: router.currentRoute.value.params.intelligentDNSId
  }

  const loadRecordServiceWithIDNSIdDecorator = async (payload) => {
    const intelligentDNSId = route.params.intelligentDNSId
    return await props.loadRecordsService({ id: payload.id, intelligentDNSId })
  }

  const editRecordServiceWithIDNSIdDecorator = async (payload) => {
    const intelligentDNSId = route.params.intelligentDNSId
    return await props.editRecordsService({ intelligentDNSId, ...payload })
  }
  const handleEditSuccess = () => {
    const pathToListIDNSRecords = props.updatedRedirect.replace(
      ':intelligentDNSId',
      route.params.intelligentDNSId
    )
    router.push({ path: pathToListIDNSRecords })
  }
</script>
