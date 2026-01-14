<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsEdgeStorage from '../FormFields/FormFieldsEdgeStorage'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  defineOptions({
    name: 'object-storage-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const toast = useToast()
  const { validationSchema, selectedBucket } = useEdgeStorage()

  const showCreateEdgeStorageDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateEdgeStorageDrawer, debouncedDrawerAnimate)

  const initialValues = {
    name: '',
    workloads_access: 'read_write',
    bucket: [selectedBucket.value.name]
  }

  const closeCreateDrawer = () => {
    showCreateEdgeStorageDrawer.value = false
  }

  const openCreateDrawer = () => {
    showCreateEdgeStorageDrawer.value = true
  }

  const handleCreateEdgeStorage = (edgeStorageResponse) => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Bucket "${edgeStorageResponse.data.name}" has been created successfully`,
      life: 5000
    })
    emit('onSuccess', edgeStorageResponse.data.name)
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer,
    showCreateDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateEdgeStorageDrawer"
    :createService="edgeStorageService.createEdgeStorageBucket"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateEdgeStorage"
    createButtonLabel="Create"
    title="Create Bucket"
    showBarGoBack
    disableToast
  >
    <template #formFields>
      <FormFieldsEdgeStorage :show-danger-zone="false" />
    </template>
  </CreateDrawerBlock>
</template>
