<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import * as yup from 'yup'
  import FormFieldsEdgeNode from '@/views/EdgeNode/FormFields/FormFieldsEdgeNode.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  const props = defineProps({
    edgeNodeId: { type: String, required: true },
    listGroupsEdgeNodeService: { type: Function, required: true },
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    hashId: yup.string().required().label('HashID'),
    groups: yup.array().label('Groups')
  })
</script>

<template>
  <EditFormBlock
    :editService="props.editEdgeNodeService"
    :loadService="props.loadEdgeNodeService"
    :updatedRedirect="props.updatedRedirect"
    :schema="validationSchema"
    backURL="/edge-node"
  >
    <template #form>
      <FormFieldsEdgeNode :listGroupsService="props.listGroupsEdgeNodeService" />
    </template>
    <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
      <ActionBarTemplate
        @onSubmit="onSubmit"
        @onCancel="onCancel"
        :loading="loading"
        :submitDisabled="!formValid"
      />
    </template>
  </EditFormBlock>
</template>
