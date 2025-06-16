<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Custom Page" />
    </template>
    <template #content>
      <CreateFormBlock
        :createService="customPageService.createCustomPagesService"
        :schema="validationSchema"
        :initialValues="initialValues"
        @on-response="handleToast"
        disableToast
      >
        <template #form>
          <FormFieldsCustomPages />
        </template>

        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarBlockWithTeleport
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsCustomPages from './FormFields/FormFieldsCustomPages'
  import { customPageService } from '@/services/v2'
  import { validationSchema, defaultValues } from './Config/validation'

  const initialValues = ref(defaultValues)

  defineOptions({
    name: 'create-custom-pages'
  })

  const handleToast = (response) => {
    const toast = {
      feedback: 'Custom Page successfully created',
      actions: {
        link: {
          label: 'View Custom Page',
          callback: () => response.redirectToUrl(`/custom-pages/edit/${response.data.id}`)
        }
      }
    }
    response.showToastWithActions(toast)
  }
</script>
