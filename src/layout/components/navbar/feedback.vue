<template>
  <PrimeButton
    :pt="{
      root: { class: 'max-md:w-[2rem] h-[2rem] justify-content-center' },
      label: { class: 'max-md:hidden' },
      icon: { class: `max-md:m-0 ${props.styleTextColor}` }
    }"
    icon="pi pi-flag"
    size="small"
    label="Feedback"
    :outlined="props.outlined"
    :class="props.class"
    @click="visible = true"
    v-tooltip.bottom="{ value: 'Feedback', showDelay: 200 }"
    data-testid="header-block__open-feedback-button"
  />

  <Dialog
    v-model:visible="visible"
    modal
    @show="resetForm()"
    header="Report an issue"
    :style="{ width: '35rem' }"
  >
    <div class="flex flex-col gap-5">
      <div class="flex flex-col gap-3">
        <label
          for="type"
          class="font-semibold"
          >Type</label
        >
        <Dropdown
          v-model="selectedIssueType"
          :options="types"
          optionLabel="name"
          optionValue="code"
          placeholder="Select one Type"
          class="max-w-[216px]"
          data-testid="feedback-dialog__dialog-body__button-type-dropdown"
        />
      </div>
      <div class="flex flex-col gap-3">
        <label
          for="type"
          class="font-semibold"
          >Report an issue</label
        >
        <Textarea
          v-model="report"
          rows="5"
          cols="30"
          data-testid="feedback-dialog__dialog-body__textarea-description"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-content-end gap-2">
        <PrimeButton
          type="button"
          label="Cancel"
          outlined
          size="small"
          class="w-20"
          @click="visible = false"
          data-testid="feedback-dialog__dialog-footer__cancel-button"
        />
        <PrimeButton
          type="button"
          severity="secondary"
          label="Send feedback"
          class="w-36"
          size="small"
          icon="pi pi-send"
          :loading="loading"
          @click="sendFeedback()"
          data-testid="feedback-dialog__dialog-footer__confirm-button"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { ref } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { createFeedbackServices } from '@/services/feedback-services'
  import { useToast } from 'primevue/usetoast'
  import Dialog from 'primevue/dialog'
  import Dropdown from 'primevue/dropdown'
  import Textarea from 'primevue/textarea'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'console-feedback' })

  const props = defineProps({
    styleTextColor: {
      type: String,
      default: () => 'text-white'
    },
    class: {
      type: String
    },
    outlined: {
      type: Boolean,
      default: true
    }
  })

  const account = useAccountStore().accountData
  const toast = useToast()

  const visible = ref(false)
  const loading = ref(false)
  const selectedIssueType = ref('issue')
  const report = ref('')

  const types = [
    { name: 'Issue', code: 'issue' },
    { name: 'Idea', code: 'idea' },
    { name: 'Other', code: 'other' }
  ]

  const resetForm = () => {
    selectedIssueType.value = 'issue'
    report.value = ''
  }

  const sendFeedback = async () => {
    try {
      loading.value = true
      const payload = {
        type: selectedIssueType.value,
        account_id: account.id,
        client_id: account.client_id,
        name: account.name,
        email: account.email,
        description: report.value
      }
      await createFeedbackServices(payload)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Feedback sent successfully',
        life: 3000
      })
      resetForm()
      visible.value = false
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Error sending feedback',
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }
</script>
