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
    :style="{ width: '40rem' }"
  >
    <div class="flex flex-col gap-5">
      <div class="max-w-[216px]">
        <FieldDropdown
          label="Type"
          name="type"
          :options="types"
          optionLabel="name"
          optionValue="code"
          :value="selectedIssueType"
          required
          placeholder="Select one Type"
          data-testid="feedback-dialog__dialog-body__button-type-dropdown"
        />
      </div>
      <FieldTextArea
        label="Report an issue"
        name="description"
        required
        :rows="5"
        placeholder="Describe your issue or idea"
        data-testid="feedback-dialog__dialog-body__textarea-description"
      />
    </div>
    <template #footer>
      <div
        class="flex justify-between items-center w-full flex-col-reverse sm:flex-row gap-2 sm:gap-0"
      >
        <div
          class="flex flex-wrap text-xs font-normal justify-start w-full gap-1 sm:gap-0 sm:w-auto"
        >
          <span>Have a technical issue? Contact</span>
          <span>
            <a
              class="text-[var(--text-color-link)] hover:text-[var(--text-color-link-hover)] cursor-pointer hover:underline"
              small
              @click="openCopilot"
              data-testid="feedback-dialog__dialog-footer__copilot-link"
              >Azion Copilot</a
            >
            or
            <a
              class="text-[var(--text-color-link)] hover:text-[var(--text-color-link-hover)] cursor-pointer hover:underline"
              :href="AZION_CONTACT_SUPPORT"
              target="_blank"
              data-testid="feedback-dialog__dialog-footer__support-link"
              >Azion Support</a
            >.
          </span>
        </div>
        <div class="flex gap-2 w-full sm:w-auto">
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
            class="sm:w-auto sm:min-w-36 whitespace-nowrap"
            size="small"
            :loading="loading"
            :pt="{
              label: { class: 'whitespace-nowrap' },
              loadingIcon: { class: '!w-3.5 !h-3.5' }
            }"
            @click="sendFeedback()"
            data-testid="feedback-dialog__dialog-footer__confirm-button"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { ref } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { storeToRefs } from 'pinia'
  import { useAccountStore } from '@/stores/account'
  import { feedbackService } from '@/services/v2/feedback'
  import { useLayout } from '@/composables/use-layout'
  import { AZION_CONTACT_SUPPORT } from '@/helpers/azion-documentation-window-opener'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Dialog from '@aziontech/webkit/dialog'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import FieldTextArea from '@aziontech/webkit/field-text-area'
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'console-feedback' })

  const props = defineProps({
    styleTextColor: {
      type: String,
      default: () => 'text-color'
    },
    class: {
      type: String
    },
    outlined: {
      type: Boolean,
      default: true
    }
  })

  const emit = defineEmits(['onError'])

  const { accountData: account } = storeToRefs(useAccountStore())
  const { OpenSidebarComponent } = useLayout()
  const toast = useToast()

  const showToast = (severity, detail) => {
    toast.add({
      severity,
      summary: severity === 'error' ? 'Error' : 'Success',
      detail,
      life: 3000
    })
  }

  const visible = ref(false)
  const loading = ref(false)
  const selectedIssueType = ref('issue')

  const types = [
    { name: 'Issue', code: 'issue' },
    { name: 'Idea', code: 'idea' },
    { name: 'Other', code: 'other' }
  ]

  const validationSchema = yup.object({
    type: yup.string().required(),
    description: yup.string().required('Please describe your issue or idea.')
  })

  const { handleSubmit, resetForm } = useForm({
    validationSchema,
    initialValues: { type: selectedIssueType.value, description: '' }
  })

  const openCopilot = () => {
    visible.value = false
    OpenSidebarComponent('copilot')
  }

  const sendFeedback = handleSubmit(async (values) => {
    try {
      loading.value = true
      const successMessage = await feedbackService.create({
        type: values.type,
        accountId: account.value.id,
        clientId: account.value.client_id,
        name: account.value.name,
        email: account.value.email,
        description: values.description
      })
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: successMessage,
        life: 3000
      })
      resetForm()
      visible.value = false
    } catch (error) {
      // Check if error is an ErrorHandler instance (from v2 services)
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
        emit('onError', error.message[0])
      } else {
        // Fallback for legacy errors or non-ErrorHandler errors
        const errorMessage = error?.message || error
        emit('onError', errorMessage)
        showToast('error', errorMessage)
      }
    } finally {
      loading.value = false
    }
  })
</script>
