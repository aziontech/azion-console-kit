<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
  import { validationSchema, initialValues } from './Config/validation'
  import { createEnvironmentAdapter } from './Config/adapters'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'create-environment' })

  const toast = useToast()

  const formatFailedKeys = (failures = []) => {
    const keys = failures.map((failure) => failure.key)
    const preview = keys.slice(0, 5).join(', ')
    return keys.length > 5 ? `${preview}, ...` : preview
  }

  const handleResponse = (response) => {
    const failures = response?.variablesFailures ?? []

    if (failures.length) {
      toast.add({
        closable: true,
        severity: 'warn',
        summary: 'Some variables failed',
        detail: `Environment created, but ${failures.length} variable(s) failed: ${formatFailedKeys(
          failures
        )}`
      })
      response.redirectToUrl(response.urlToEditView ?? '/environments')
      return
    }

    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: response?.feedback ?? 'Environment created successfully'
    })
    response.redirectToUrl('/environments')
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Environment"
        description="Configure a new deploy environment for your applications."
      />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createEnvironmentAdapter"
        :schema="validationSchema"
        :initialValues="initialValues"
        disabledCallback
        disableAfterCreateToastFeedback
        @on-response="handleResponse"
      >
        <template #form>
          <FormFieldsEnvironment :isEdit="false" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
