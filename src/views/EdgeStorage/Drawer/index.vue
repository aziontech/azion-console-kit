<template>
  <CreateDrawerBlock
    v-if="loadCreateCredentialDrawer"
    v-model:visible="showCreateCredentialDrawer"
    :createService="createCredentialService"
    drawerId="create-credential-drawer"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleSuccessCreate"
    title="Create Credential"
    disableToast
  >
    <template #formFields>
      <FormFieldsCredential />
    </template>
  </CreateDrawerBlock>
</template>

<script setup>
  import { ref } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsCredential from '../FormFields/FormFieldsCredential.vue'
  import { refDebounced } from '@vueuse/core'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'

  const { addCredential } = useEdgeStorage()
  defineOptions({ name: 'drawer-credential' })

  const emit = defineEmits(['onSuccess'])
  const toast = useToast()

  const showCreateCredentialDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreateCredentialDrawer = refDebounced(
    showCreateCredentialDrawer,
    debouncedDrawerAnimate
  )

  const initialValues = ref({
    name: '',
    expirationDate: null
  })

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    expirationDate: yup.date().required().label('Expiration Date')
  })

  const createCredentialService = async (credentialData) => {
    const newCredential = addCredential(credentialData)
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Credential created successfully'
    })

    emit('onSuccess', newCredential)
    showCreateCredentialDrawer.value = false
  }

  const openDrawerCreate = () => {
    showCreateCredentialDrawer.value = true
  }

  defineExpose({
    showCreateCredentialDrawer,
    openDrawerCreate
  })
</script>
