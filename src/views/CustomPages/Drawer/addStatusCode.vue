<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsCustomPages from '../FormFields/FormFieldsCustomPages'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeConnectorsService, customPageService } from '@/services/v2'

  defineOptions({
    name: 'custom-pages-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  defineProps({
    loadService: {
      type: Function,
      required: false
    },
    editService: {
      type: Function,
      required: false
    }
  })

  const getEdgeConnectors = async (query) => {
    return await edgeConnectorsService.listEdgeConnectorsService({
      fields: 'id,name',
      ...query
    })
  }

  const showCreateCustomPagesDrawer = ref(false)
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCustomPagesDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)

  const initialValues = ref({
    name: '',
    isActive: false,
    isDefault: false,
    edgeConnectorId: null,
    pages: []
  })

  const closeCreateDrawer = () => {
    showCreateCustomPagesDrawer.value = false
  }
  const openCreateDrawer = () => {
    showCreateCustomPagesDrawer.value = true
  }
  const openEditDrawer = (customPagesId) => {
    selectedCustomPageToEdit.value = `${customPagesId}`
    showEditCustomPagesDrawer.value = true
  }

  const handleCreateCustomPages = (response) => {
    emit('onSuccess', response.id)
    closeCreateDrawer()
  }

  const handleEditedCustomPages = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer,
    openEditDrawer,
    showCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateCustomPagesDrawer"
    :createService="customPageService.createCustomPagesService"
    id="create-custom-page-drawer"
    drawerId="create-custom-page-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCustomPages"
    title="Create Custom Page"
    isOverlapped
  >
    <template #formFields>
      <FormFieldsCustomPages
        :loadEdgeConnectorsService="edgeConnectorsService.loadEdgeConnectorsService"
        :listEdgeConnectorsService="getEdgeConnectors"
      />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditDrawer"
    :id="selectedCustomPageToEdit"
    v-model:visible="showEditCustomPagesDrawer"
    :loadService="customPageService.loadCustomPagesService"
    :editService="customPageService.editCustomPagesService"
    :schema="validationSchema"
    @onSuccess="handleEditedCustomPages"
    title="Edit Custom Page"
    isOverlapped
  >
    <template #formFields>
      <FormFieldsCustomPages
        :loadEdgeConnectorsService="edgeConnectorsService.loadEdgeConnectorsService"
        :listEdgeConnectorsService="getEdgeConnectors"
      />
    </template>
  </EditDrawerBlock>
</template>
