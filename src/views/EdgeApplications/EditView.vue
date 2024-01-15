<template>
  <EditFormBlock
    :editService="props.editEdgeApplicationService"
    :loadService="props.loadEdgeApplicationService"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    :isTabs="true"
  >
    <template #form>
      <FormFieldsCreateEdgeApplications
        :handleBlock="handleBlocks"
        :contactSalesEdgeApplicationService="contactSalesEdgeApplicationService"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
      <ActionBarBlockWithTeleport
        v-if="showActionBar"
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>

<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import FormFieldsCreateEdgeApplications from './FormFields/FormFieldsCreateEdgeApplications'
  import ActionBarBlockWithTeleport from '@templates/action-bar-block/action-bar-with-teleport'

  const props = defineProps({
    loadEdgeApplicationService: {
      type: Function,
      required: true
    },
    editEdgeApplicationService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    contactSalesEdgeApplicationService: {
      type: Function,
      required: true
    },
    showActionBar: {
      type: Boolean,
      default: true
    }
  })

  const handleBlocks = ['general', 'delivery-settings', 'edge-application-modules', 'debug-rules']

  const validationSchema = yup.object({
    name: yup.string().required()
  })
</script>
