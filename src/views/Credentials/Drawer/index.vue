<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsCredential from '../FormFields/FormFieldsCredential.vue'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'

  defineOptions({
    name: 'credential-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const toast = useToast()

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .matches(/^[a-zA-Z0-9-]+$/, 'Name must contain only letters, numbers, and hyphens'),
    bucket: yup.string().label('Bucket').required(),
    capabilities: yup.array().label('Capabilities').min(1, 'At least one capability is required'),
    expirationDate: yup.date().label('Expiration Date').required()
  })

  const showCreateCredentialDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCredentialDrawer, debouncedDrawerAnimate)

  const initialValues = {
    name: '',
    bucket: '',
    capabilities: [],
    expirationDate: null
  }

  const closeCreateDrawer = () => {
    showCreateCredentialDrawer.value = false
  }

  const openCreateDrawer = () => {
    showCreateCredentialDrawer.value = true
  }

  const handleCreateCredential = (credentialResponse) => {
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Credential "${credentialResponse.data.name}" has been created successfully`,
      life: 5000
    })
    emit('onSuccess')
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
    v-model:visible="showCreateCredentialDrawer"
    :createService="edgeStorageService.createCredential"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCredential"
    createButtonLabel="Create"
    title="Create Credential"
    showBarGoBack
    disableToast
  >
    <template #formFields>
      <FormFieldsCredential />
    </template>
  </CreateDrawerBlock>
</template>
