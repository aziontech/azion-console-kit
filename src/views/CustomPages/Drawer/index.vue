<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsCustomPages from '@/views/CustomPages/FormFields/CustomPages'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { customPageService } from '@/services/v2'

  import { validationSchema, defaultValues } from '../Config/validationSchema'

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

  const showCreateCustomPagesDrawer = ref(false)
  const showEditCustomPagesDrawer = ref(false)
  const selectedCustomPageToEdit = ref('')
  const debouncedDrawerAnimate = 300
  const showCreateDrawer = refDebounced(showCreateCustomPagesDrawer, debouncedDrawerAnimate)
  const showEditDrawer = refDebounced(showEditCustomPagesDrawer, debouncedDrawerAnimate)

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
    emit('onSuccess', response.data.id)
    handleToast(response)
    closeCreateDrawer()
  }
  const handleEditedCustomPages = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }
  const handleToast = (response) => {
    const toast = {
      feedback: 'Your custom page has been created'
    }
    response.showToastWithActions(toast)
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
    :initialValues="defaultValues"
    @onSuccess="handleCreateCustomPages"
    title="Create Custom Page"
    isOverlapped
    expandable
    expandedDefault
    disableToast
  >
    <template #formFields>
      <FormFieldsCustomPages />
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
      <FormFieldsCustomPages />
    </template>
  </EditDrawerBlock>
</template>
