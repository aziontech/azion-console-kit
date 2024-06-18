<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Credential"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editCredentialService"
        :loadService="loadCredentialService"
        :updatedRedirect="updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsEdit @copyToken="copyToken"></FormFieldsEdit>
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
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
  import FormFieldsEdit from './FormFields/FormFieldsEditCredentials.vue'
  import { useToast } from 'primevue/usetoast'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'

  const props = defineProps({
    editCredentialService: {
      type: Function,
      required: true
    },
    loadCredentialService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    description: yup.string(),
    token: yup.string(),
    status: yup.boolean()
  })

  const toast = useToast()
  const copyToken = async ({ token }) => {
    props.clipboardWrite(token)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'token copied'
    })
  }
</script>
