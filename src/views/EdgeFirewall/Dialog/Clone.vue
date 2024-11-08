<template>
  <div>
    <PrimeDialog
      :blockScroll="true"
      visible
      modal
      class="w-[40vw]"
    >
      <template #header>
        <h5 class="text-lg not-italic font-bold leading-5">Clone {{ edgeFirewall.name }}</h5>
      </template>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-sm font-medium leading-5 flex gap-1 align-items-center"
          >To confirm, type a unique and easy-to-remember name for the new Edge Firewall::</label
        >
        <InputText
          id="name"
          v-model="edgeFirewallName"
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
            @click="cloneEdgeFirewall()"
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
  import * as EdgeFirewallService from '@/services/edge-firewall-services/v4'

  defineOptions({ name: 'Clone-Dialog' })

  const emit = defineEmits(['cloneCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const edgeFirewall = dialogRef.value.data
  const loading = ref(false)
  const edgeFirewallName = ref('')
  const router = useRouter()

  const showFeedback = (feedback = 'cloned successfully') => {
    const feedbackMessage = feedback
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedbackMessage
    })
  }

  const feedbackEdgeFirewallCloned = (response) => {
    showFeedback(response.feedback)
    router.push({ path: response.urlToEditView })
  }

  const loadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const cloneEdgeFirewall = async () => {
    try {
      loading.value = true
      const response = await EdgeFirewallService.cloneEdgeFirewallService({
        edgeFirewallName: edgeFirewallName.value,
        payload: edgeFirewall
      })
      feedbackEdgeFirewallCloned(response)
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
