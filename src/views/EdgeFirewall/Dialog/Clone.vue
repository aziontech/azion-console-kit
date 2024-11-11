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
        <FieldText
          label="To confirm, type a unique and easy-to-remember name for the new Edge Firewall:"
          name="edgeFirewallName"
          :value="edgeFirewallName"
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
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  import { useRouter } from 'vue-router'
  import * as EdgeFirewallService from '@/services/edge-firewall-services/v4'
  import * as yup from 'yup'

  defineOptions({ name: 'Clone-Dialog' })

  const emit = defineEmits(['cloneCancel'])

  const dialogRef = inject('dialogRef')
  const toast = useToast()
  const edgeFirewall = dialogRef.value.data
  const loading = ref(false)
  const router = useRouter()
  import { useField, useForm } from 'vee-validate'

  const validationSchema = yup.object({
    edgeFirewallName: yup.string().required().label('Name')
  })

  const initialValues = {
    edgeFirewallName: ''
  }

  const showFeedback = (feedback = 'cloned successfully') => {
    const feedbackMessage = feedback
    toast.add({
      closable: true,
      severity: 'success',
      summary: feedbackMessage
    })
  }

  const { handleSubmit } = useForm({
    initialValues,
    validationSchema
  })

  const { value: edgeFirewallName } = useField('edgeFirewallName')

  const feedbackEdgeFirewallCloned = (response) => {
    showFeedback(response.feedback)
    router.push({ path: response.urlToEditView })
  }

  const loadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const cloneEdgeFirewall = handleSubmit(async () => {
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
  })

  const closeDialog = () => {
    dialogRef.value.close()
  }
</script>
