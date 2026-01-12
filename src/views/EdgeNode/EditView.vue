<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import { inject, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import * as yup from 'yup'
  import FormFieldsEdgeNode from '@/views/EdgeNode/FormFields/FormFieldsEdgeNode'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  defineOptions({ name: 'edit-edge-node' })
  const emit = defineEmits(['handleEdgeNodesUpdated'])
  const tracker = inject('tracker')
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const nodeName = ref('Edit Edge Node')

  const setNodeName = (node) => {
    nodeName.value = node.name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, node.name)
  }

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
    groups: yup.array().label('Groups'),
    hasServices: yup.boolean().label('Service')
  })

  const formSubmit = async (onSubmit, values, formValid) => {
    await onSubmit()
    if (formValid) {
      emit('handleEdgeNodesUpdated', values)
    }
  }

  const handleTrackSuccessEdit = () => {
    tracker.track('Edge Node edited successfully')
  }
</script>

<template>
  <EditFormBlock
    :editService="props.editEdgeNodeService"
    :loadService="props.loadEdgeNodeService"
    :updatedRedirect="props.updatedRedirect"
    @loaded-service-object="setNodeName"
    @on-edit-success="handleTrackSuccessEdit"
    :schema="validationSchema"
    :isTabs="true"
  >
    <template #form>
      <PageHeadingBlock :pageTitle="nodeName" description="Configure general settings and Edge Services for this Edge Node." />
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
