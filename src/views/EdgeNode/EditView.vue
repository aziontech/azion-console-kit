<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import { inject } from 'vue'
  import * as yup from 'yup'
  import FormFieldsEdgeNode from '@/views/EdgeNode/FormFields/FormFieldsEdgeNode'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { edgeNodeService } from '@/services/v2/edge-node/edge-node-service'

  defineOptions({ name: 'edit-edge-node' })
  const emit = defineEmits(['handleEdgeNodesUpdated'])
  const tracker = inject('tracker')

  const props = defineProps({
    hiddenActionBar: { type: Boolean, default: false },
    listGroupsEdgeNodeService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true },
    edgeNode: { type: Object, default: () => ({}) },
    initialValues: { type: Object, default: () => ({}) }
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    hashId: yup.string().required().label('Hash ID'),
    groups: yup.array().label('Groups'),
    hasServices: yup.boolean().label('Service')
  })

  const loadEdgeNodeService = async ({ id }) => {
    return await edgeNodeService.loadEdgeNodeService({ id })
  }

  const formSubmit = async (onSubmit, values, formValid) => {
    if (!formValid) return
    await onSubmit()
    emit('handleEdgeNodesUpdated', values)
  }

  const handleTrackSuccessEdit = () => {
    tracker.track('Edge Node edited successfully')
  }
</script>

<template>
  <EditFormBlock
    :editService="edgeNodeService.editEdgeNodeService"
    :loadService="loadEdgeNodeService"
    :initialValues="props.initialValues ?? {}"
    :updatedRedirect="props.updatedRedirect"
    disableRedirect
    :schema="validationSchema"
    :isTabs="true"
    @on-edit-success="handleTrackSuccessEdit"
  >
    <template #form="{ loading }">
      <FormFieldsEdgeNode
        :listGroupsService="props.listGroupsEdgeNodeService"
        :loading="loading"
      />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading, values }">
      <ActionBarTemplate
        v-if="props.hiddenActionBar"
        @onSubmit="formSubmit(onSubmit, values, formValid)"
        @onCancel="onCancel"
        :loading="loading"
      />
    </template>
  </EditFormBlock>
</template>
