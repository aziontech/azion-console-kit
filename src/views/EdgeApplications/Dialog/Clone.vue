<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      visible
      modal
      class="max-w-xl"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Clone {{ edgeApplication.name }}</h5>
      </template>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="To confirm, type a unique and easy-to-remember name for the new Edge Application:"
          name="edgeApplicationName"
          :value="edgeApplicationName"
          placeholder="Name"
        />
      </div>

      <template #closeicon>
        <PrimeButton
          outlined
          @click="closeDialog()"
          icon="pi pi-times"
        />
      </template>

      <template #footer>
        <div class="flex gap-2 flex-col-reverse md:flex-row sm:justify-end w-full md:w-auto">
          <PrimeButton
            severity="primary"
            outlined
            label="Cancel"
            @click="closeDialog()"
          ></PrimeButton>
          <PrimeButton
            severity="secondary"
            label="Clone"
            :disabled="loading"
            :icon="loadIconByLoadingState"
            @click="cloneEdgeApplication()"
          ></PrimeButton>
        </div>
      </template>
    </PrimeDialog>
  </div>
</template>

<script setup>
  import { inject, ref, computed } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import PrimeDialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { useRouter } from 'vue-router'
  import * as EdgeApplicationService from '@/services/edge-application-services/v4'
  import * as yup from 'yup'
  import { useField, useForm } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  defineOptions({ name: 'Clone-Dialog' })

  const emit = defineEmits(['cloneCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const edgeApplication = dialogRef.value.data
  const loading = ref(false)
  const router = useRouter()

  const showFeedback = (feedback = 'cloned successfully') => {
    const feedbackMessage = feedback
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedbackMessage
    })
  }

  const validationSchema = yup.object({
    edgeApplicationName: yup.string().required().label('Name')
  })
  const initialValues = {
    edgeApplicationName: ''
  }

  const { handleSubmit } = useForm({
    initialValues,
    validationSchema
  })

  const { value: edgeApplicationName } = useField('edgeApplicationName')

  const feedbackEdgeAppCloned = (response) => {
    showFeedback(response.feedback)
    router.push({ path: response.urlToEditView })
  }

  const loadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const cloneEdgeApplication = handleSubmit(async () => {
    try {
      loading.value = true
      const response = await EdgeApplicationService.cloneEdgeApplicationService({
        edgeApplicationName: edgeApplicationName.value,
        payload: edgeApplication
      })
      feedbackEdgeAppCloned(response)
      emit('cloneCancel')
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      loading.value = false
      closeDialog()
    }
  })

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
