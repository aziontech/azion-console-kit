<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
  import { validationSchema, initialValues } from './Config/validation'
  import { createEnvironmentAdapter } from './Config/adapters'

  defineOptions({ name: 'create-environment' })
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
        disableToast
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
