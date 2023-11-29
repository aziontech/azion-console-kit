<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Intelligent DNS Records"> </PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createRecordsService"
        :schema="validationSchema"
        :initialValues="initialValues"
        :updatedRedirect="`intelligent-dns/edit/${route.params.id}/records`"
        :goBack="true"
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
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useRoute } from 'vue-router'
  import CreateFormBlock from '@templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@templates/page-heading-block'
  import FormFieldsRecords from './FormFields/FormFieldsRecords.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  const props = defineProps({
    createRecordsService: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()

  //Validation Schema
  const validationSchema = yup.object({
    name: yup.string().required(),
    selectedRecordType: yup.string().required('Please select an option'),
    value: yup.string().required(),
    ttl: yup.number().required(),
    selectedPolicy: yup.string().required('Please select an option').default('simple'),
    weight: yup.number().required('Weight is a required field'),
    description: yup.string()
  })

  const initialValues = {
    intelligentDNSID: route.params.id,
    selectedRecordType: 'A',
    ttl: 3600,
    selectedPolicy: 'simple',
    weight: '100'
  }
</script>
