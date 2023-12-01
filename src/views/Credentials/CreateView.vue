<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Credential"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createCredentialService"
        :schema="validationSchema"
        @on-response="handleResponse"
        :disabledFeedback="true"
      >
        <template #form>
          <FormFieldsCreate
            @copyToken="copyToken"
            :token="token"
            :generatedToken="generatedToken"
          ></FormFieldsCreate>
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
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsCreate from './FormFields/FormFieldsCreateCredentials.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'

  const props = defineProps({
    createCredentialService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    description: yup.string(),
    token: yup.string(),
    status: yup.boolean().default(true)
  })

  const token = ref('')
  const generatedToken = ref(false)

  const toast = useToast()
  const handleResponse = (data) => {
    toast.add({
      closable: false,
      severity: 'success',
      summary: data.feedback,
      life: 10000
    })
    if (data.token) {
      token.value = data.token
      generatedToken.value = true
    }
  }

  const copyToken = async () => {
    props.clipboardWrite(token.value)
    toast.add({
      closable: false,
      severity: 'success',
      summary: 'token copied',
      life: 10000
    })
  }
</script>
