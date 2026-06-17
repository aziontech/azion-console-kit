<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import { validationSchema, initialValues } from './Config/validation'
  import { createDeploymentAdapter } from './Config/adapters'

  defineOptions({ name: 'create-deployment' })
</script>

<template>
  <ContentBlock data-testid="deployment-create-content-block">
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Deployment"
        description="Configure a new deployment stream for your applications."
        data-testid="deployment-create-heading"
      />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="createDeploymentAdapter"
        :schema="validationSchema"
        :initialValues="initialValues"
        disableToast
      >
        <template #form>
          <FormFieldsDeployment />
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
