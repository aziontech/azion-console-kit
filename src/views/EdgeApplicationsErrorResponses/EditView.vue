<script setup>
  import FormFieldsErrorResponses from '@/views/EdgeApplicationsErrorResponses/FormFields/FormFieldsErrorResponses'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'
  import EditFormBlock from '@/templates/edit-form-block'
  import * as yup from 'yup'

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    listOriginsService: {
      type: Function,
      required: true
    },
    editErrorResponsesService: {
      type: Function,
      required: true
    },
    loadErrorResponsesService: {
      type: Function,
      required: true
    },
    showActionBar: {
      type: Boolean,
      default: true
    }
  })

  const editService = async (payload) => {
    return await props.editErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const loadService = async (payload) => {
    return await props.loadErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const validationSchema = yup.object({
    originId: yup.string().required(),
    errorResponses: yup.array().of(
      yup.object().shape({
        code: yup.string().required(),
        timeout: yup.number().required(),
        uri: yup.string().nullable(true),
        customStatusCode: yup.string().nullable(true)
      })
    )
  })
</script>

<template>
  <EditFormBlock
    :editService="editService"
    :loadService="loadService"
    :schema="validationSchema"
    :isTabs="true"
  >
    <template #form>
      <FormFieldsErrorResponses
        :edgeApplicationId="edgeApplicationId"
        :listOriginsService="props.listOriginsService"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
      <ActionBarBlockWithTeleport
        v-if="props.showActionBar"
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>
