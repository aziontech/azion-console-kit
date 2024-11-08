<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      visible
      modal
      class="w-[40vw]"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Clone {{ edgeApplication.name }}</h5>
      </template>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5 flex gap-1 align-items-center"
          >To confirm, type a unique and easy-to-remember name for the new Edge Application::</label
        >
        <InputText
          id="name"
          v-model="edgeApplicationName"
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
        <div class="flex gap-2 flex-col-reverse lg:flex-row justify-end">
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
  import InputText from 'primevue/inputtext'
  import { useRouter } from 'vue-router'
  import * as EdgeApplicationService from '@/services/edge-application-services/v4'

  defineOptions({ name: 'Clone-Dialog' })

  const emit = defineEmits(['cloneCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const edgeApplication = dialogRef.value.data
  const loading = ref(false)
  const edgeApplicationName = ref('')
  const router = useRouter()

  const showFeedback = (feedback = 'cloned successfully') => {
    const feedbackMessage = feedback
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedbackMessage
    })
  }

  const feedbackEdgeAppCloned = (response) => {
    showFeedback(response.feedback)
    router.push({ path: response.urlToEditView })
  }

  const loadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const cloneEdgeApplication = async () => {
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
  }

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
