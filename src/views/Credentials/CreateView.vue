<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Credential"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createCredentialService"
        :schema="validationSchema"
        :initialValues="initialValues"
        :disabledCallback="true"
        @on-response="handleResponse"
      >
        <template #form>
          <FormFieldsCreate
            @copyToken="copyToken"
            :token="token"
            :generatedToken="generatedToken"
          ></FormFieldsCreate>
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="generatedToken"
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
    name: yup.string().required().label('Name'),
    description: yup.string(),
    token: yup.string(),
    status: yup.boolean()
  })
  const initialValues = {
    name: '',
    description: '',
    token: '',
    status: true
  }

  const token = ref('')
  const generatedToken = ref(false)

  const toast = useToast()
  const handleResponse = (data) => {
    token.value = data.token
    generatedToken.value = true
  }

  const copyToken = async () => {
    props.clipboardWrite(token.value)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'token copied'
    })
  }
</script>
