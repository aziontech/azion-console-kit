<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Origins"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="editOriginWithEdgeApplicationIdDecorator"
        :loadService="loadOrigin"
        :schema="validationSchema"
        :updatedRedirect="updatedRedirect"
      >
        <template #form>
          <FormFieldsEditEdgeApplicationsOrigins />
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarBlockWithTeleport
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
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsEditEdgeApplicationsOrigins from './FormFields/FormFieldsEditEdgeApplicationsOrigins'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import * as yup from 'yup'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { useRoute } from 'vue-router'

  const route = useRoute()

  const props = defineProps({
    editOriginService: {
      type: Function,
      required: true
    },
    loadOriginService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })

  async function editOriginWithEdgeApplicationIdDecorator(formValues) {
    const { id } = route.params
    return await props.editOriginService(formValues, id)
  }
  async function loadOrigin() {
    const { id, originKey } = route.params
    return await props.loadOriginService({ id, originKey })
  }

  const validationSchema = yup.object({
    name: yup.string().required(),
    addresses: yup.array().of(
      yup.object().shape({
        address: yup.string().required(),
        isActive: yup.boolean()
      })
    )
  })
</script>
