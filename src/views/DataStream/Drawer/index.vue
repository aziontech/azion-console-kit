<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateTemplateDrawer"
    :createService="createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateTemplate"
    :showBarGoBack="true"
    title="Create Custom Template"
    data-testid="data-stream-create-template-drawer"
  >
    <template #formFields>
      <FormFieldsTemplate />
    </template>
  </CreateDrawerBlock>
  <EditDrawerBlock
    v-if="showEditDrawer"
    v-model:visible="showEditTemplateDrawer"
    :loadService="loadService"
    :editService="editService"
    :id="templateId"
    :schema="validationSchema"
    @onSuccess="handleEditTemplate"
    :showBarGoBack="true"
    title="Edit Custom Template"
    data-testid="data-stream-edit-template-drawer"
  >
    <template #formFields>
      <FormFieldsTemplate
        @onDelete="handleDeleteTemplate"
        :templateId="templateId"
      />
    </template>
  </EditDrawerBlock>
</template>

<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsTemplate from '../FormFields/FormFieldsTemplate.vue'
  import * as yup from 'yup'
  import { ref } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import { dataStreamService } from '@/services/v2'

  defineOptions({
    name: 'drawer-template'
  })

  const debouncedDrawerAnimate = 300
  const showCreateTemplateDrawer = ref(false)
  const showEditTemplateDrawer = ref(false)
  const templateId = ref(0)
  const showCreateDrawer = refDebounced(showCreateTemplateDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditTemplateDrawer, debouncedDrawerAnimate)

  const validationSchema = yup.object({
    name: yup.string().label('Name').required(),
    dataSet: yup.string().label('Data Set').required()
  })

  const initialValues = {
    name: '',
    dataSet: ''
  }

  const createService = (data) => {
    return dataStreamService.createTemplateService(data)
  }
  const editService = (data) => {
    return dataStreamService.editTemplateService(data)
  }

  const loadService = (query) => {
    return dataStreamService.loadTemplateService(query)
  }

  const emit = defineEmits(['onSuccess'])

  const openCreateDrawer = (dataSet) => {
    initialValues.dataSet = dataSet
    showCreateTemplateDrawer.value = true
  }

  const openEditDrawer = (id) => {
    templateId.value = id
    showEditTemplateDrawer.value = true
  }

  const handleCreateTemplate = (response) => {
    emit('onSuccess', response)
    showCreateTemplateDrawer.value = false
  }

  const handleEditTemplate = (response) => {
    emit('onSuccess', response)
    showEditTemplateDrawer.value = false
  }

  const handleDeleteTemplate = () => {
    emit('onDelete')
    showEditTemplateDrawer.value = false
    templateId.value = 0
  }

  defineExpose({
    showCreateDrawer,
    showEditDrawer,
    openCreateDrawer,
    openEditDrawer
  })
</script>
