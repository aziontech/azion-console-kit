<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import * as yup from 'yup'
  import FormFieldsEdgeNode from '@/views/EdgeNode/FormFields/FormFieldsEdgeNode'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  defineOptions({ name: 'edit-edge-node' })
  const emit = defineEmits(['handleEdgeNodesUpdated'])

  const props = defineProps({
    hiddenActionBar: { type: Boolean, default: false },
    listGroupsEdgeNodeService: { type: Function, required: true },
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    hashId: yup.string().required().label('Hash ID'),
    groups: yup.array().label('Groups')
  })

  const formSubmit = async (onSubmit, values, formValid) => {
    await onSubmit()
    if (formValid) {
      emit('handleEdgeNodesUpdated', values)
    }
  }
</script>

<template>
  <EditFormBlock
    :editService="props.editEdgeNodeService"
    :loadService="props.loadEdgeNodeService"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    :isTabs="true"
  >
    <template #form>
      <FormFieldsEdgeNode :listGroupsService="props.listGroupsEdgeNodeService" />
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
