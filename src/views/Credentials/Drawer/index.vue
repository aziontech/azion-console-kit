<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsCredential from '../FormFields/FormFieldsCredential.vue'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useToast } from 'primevue/usetoast'
  import { useDialog } from 'primevue/usedialog'
  import * as yup from 'yup'
  import CopyCredentialDialog from '@/views/EdgeStorage/Dialog/CopyCredentialDialog.vue'

  defineOptions({
    name: 'credential-drawer'
  })

  const emit = defineEmits(['onSuccess'])
  const toast = useToast()
  const dialog = useDialog()

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .matches(/^[a-zA-Z0-9-]+$/, 'Name must contain only letters, numbers, and hyphens'),
    bucket: yup.array().label('Bucket').min(1, 'At least one bucket is required'),
    capabilities: yup.array().label('Capabilities').min(1, 'At least one capability is required'),
    expirationDate: yup.date().label('Expiration Date').required()
  })

  const showCreateCredentialDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCredentialDrawer, debouncedDrawerAnimate)

  const initialValues = {
    name: '',
    bucket: ['__ALL_BUCKETS__'],
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
    closeCreateDrawer()

    dialog.open(CopyCredentialDialog, {
      props: {
        header: 'Credential has been created',
        modal: true,
        blockScroll: true,
        style: { width: '32rem' }
      },
      data: {
        credential: credentialResponse.data
      },
      onClose: () => {
        emit('onSuccess')
      }
    })
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
