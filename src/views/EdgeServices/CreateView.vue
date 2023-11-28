<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Edge Service"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createEdgeService"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormCreateEdgeService />
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
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormCreateEdgeService from './form/FormCreateEdgeService.vue'
  import * as yup from 'yup'
  import edgeServiceHelloWorld from '@/helpers/edge-service-hello-world'

  const props = defineProps({
    createEdgeService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    code: yup.string().required(),
    active: yup.boolean().required()
  })

  const initialValues = {
    name: '',
    code: edgeServiceHelloWorld,
    active: false
  }
</script>
