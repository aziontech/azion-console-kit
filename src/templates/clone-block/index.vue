<template>
  <PrimeDialog
    :blockScroll="true"
    visible
    modal
    class="max-w-xl"
  >
    <template #header>
      <h5 class="text-lg font-medium leading-5">Clone {{ selectedItem.name }}</h5>
    </template>

    <div class="flex flex-col sm:max-w-lg w-full gap-2">
      <p class="leading-relaxed text-color-secondary text-sm font-normal">{{ fieldLabel }}</p>
      <FieldText
        label="Name"
        name="cloneName"
        :value="cloneName"
        :placeholder="placeholder"
        required
      />
    </div>

    <template #closeicon>
      <PrimeButton
        outlined
        icon="pi pi-times"
        @click="handleCancel"
      />
    </template>

    <template #footer>
      <div class="flex gap-2 flex-col-reverse md:flex-row sm:justify-end w-full md:w-auto">
        <PrimeButton
          severity="primary"
          outlined
          label="Cancel"
          @click="handleCancel"
        />
        <PrimeButton
          severity="secondary"
          label="Clone"
          :disabled="isLoading"
          :icon="loadingIcon"
          @click="handleClone"
        />
      </div>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { inject, ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'

  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  defineOptions({ name: 'CloneBlock' })

  const emit = defineEmits(['cloneCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const router = useRouter()

  const dialogData = dialogRef.value.data
  const cloneService = dialogData.service
  const itemType = dialogData.itemType || 'item'
  const selectedItem = dialogData

  const isLoading = ref(false)

  const validationSchema = yup.object({
    cloneName: yup.string().required().label('Name')
  })

  const initialValues = {
    cloneName: ''
  }

  const { handleSubmit } = useForm({
    initialValues,
    validationSchema
  })

  const { value: cloneName } = useField('cloneName')

  const fieldLabel = computed(() => {
    return `To confirm the cloning process, enter a unique and easily recognizable name to complete the creation of the new ${itemType}:`
  })

  const placeholder = computed(() => {
    return `My ${itemType}`
  })

  const loadingIcon = computed(() => {
    return isLoading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const showSuccessMessage = (message = 'Cloned successfully') => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: message
    })
  }

  const showErrorMessage = (error) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
    } else {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const handleCloneSuccess = (response) => {
    showSuccessMessage(response.feedback)
    if (response.urlToEditView) {
      router.push({ path: response.urlToEditView })
    }
  }

  const handleCancel = () => {
    emit('cloneCancel')
    dialogRef.value.close()
  }

  const handleClone = handleSubmit(async () => {
    try {
      isLoading.value = true
      const response = await cloneService({ cloneName: cloneName.value, id: selectedItem.id })
      handleCloneSuccess(response)
      handleCancel()
    } catch (error) {
      showErrorMessage(error)
    } finally {
      isLoading.value = false
    }
  })
</script>
