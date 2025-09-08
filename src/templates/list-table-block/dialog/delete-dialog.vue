<template>
  <PrimeDialog
    blockScroll
    modal
    visible
    :closeOnEscape="false"
    :header="`Delete ${data.title}`"
    :draggable="false"
    class="max-w-2xl"
    @keyup.enter="removeItem()"
    @keydown.esc="cancelDialog"
    data-testid="delete-dialog"
  >
    <div
      class="flex flex-col gap-6"
      data-testid="delete-dialog-content"
    >
      <div data-testid="delete-dialog-warning">
        <Message
          severity="warn"
          :closable="false"
          data-testid="delete-dialog-warning-message"
        >
          Once confirmed, this action can't be reversed.
        </Message>

        <p
          class="pt-4 text-color-secondary"
          data-testid="delete-dialog-warning-message-details"
        >
          {{ deleteMessage }}
        </p>
      </div>

      <div
        data-testid="delete-dialog-confirmation"
        v-if="!data.bypassConfirmation"
      >
        <div
          class="flex flex-col w-full gap-2"
          data-testid="delete-dialog-confirmation-input"
        >
          <label
            for="confirm-input"
            class="font-semibold text-sm"
            data-testid="delete-dialog-confirmation-input-label"
            >To confirm, type "{{ data.deleteConfirmationText }}" in the box below:</label
          >
          <InputText
            id="confirm-input"
            type="text"
            autofocus
            :disabled="loading"
            v-model="confirmation"
            :class="{ 'p-invalid': errors.confirmation }"
            data-testid="delete-dialog-confirmation-input-field"
          />
          <small
            v-if="errors.confirmation"
            class="p-error text-xs font-normal leading-tight"
            data-testid="delete-dialog-confirmation-input-error"
            >{{ errors.confirmation }}</small
          >
        </div>
      </div>
    </div>

    <template #closeicon>
      <PrimeButton
        outlined
        @click="cancelDialog()"
        icon="pi pi-times"
      />
    </template>

    <template #footer>
      <PrimeButton
        outlined
        label="Cancel"
        @click="cancelDialog()"
        data-testid="delete-dialog-footer-cancel-button"
      ></PrimeButton>
      <PrimeButton
        severity="danger"
        label="Delete"
        icon-pos="right"
        @click="removeItem()"
        :icon="getLoadingIcon"
        :disabled="isDisabled"
        data-testid="delete-dialog-footer-delete-button"
      ></PrimeButton>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, ref, watch, inject } from 'vue'
  import { useField, useForm } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import * as yup from 'yup'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Message from 'primevue/message'

  const emit = defineEmits(['successfullyDeleted'])

  const toast = useToast()
  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const loading = ref(false)
  const canDelete = ref(false)

  const validationSchema = yup.object({
    confirmation: yup
      .string()
      .equals([data.deleteConfirmationText], '')
      .label('Confirmation')
      .required()
  })

  const { errors, meta, resetForm } = useForm({
    validationSchema,
    initialValues: {
      confirmation: ''
    }
  })

  const { value: confirmation } = useField('confirmation')

  const removeItem = async () => {
    if ((!canDelete.value || !meta.value.valid) && !data.bypassConfirmation) return

    loading.value = true
    try {
      const feedback = await data.deleteService(data.selectedID, data.selectedItemData)
      showToast('Success', 'Success', feedback ?? 'Deleted successfully!')
      emit('successfullyDeleted')
      resetForm()
      dialogRef.value.close({ updated: true })
      if (data.onSuccess) {
        data.onSuccess()
      }
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        showToast('Error', 'Error', error)
      }
    } finally {
      loading.value = false
    }
  }

  const showToast = (severity, summary, detail = '') => {
    toast.add({
      closable: true,
      severity,
      summary,
      detail: detail || 'An error occurred while trying to delete the item. Please try again.'
    })
  }

  const cancelDialog = () => {
    resetForm()
    dialogRef.value.close({ updated: false })
  }

  const getLoadingIcon = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabled = computed(() => {
    return (!meta.value.valid && !data.bypassConfirmation) || loading.value
  })

  const deleteMessage = computed(() => {
    return (
      data.entityDeleteMessage ||
      `The selected ${data.title} will be deleted, along with all associated settings or instances. Check the Help Center for more details.`
    )
  })

  watch(
    () => data,
    (value) => {
      if (value) {
        canDelete.value = false
        resetForm()
      }
    },
    { deep: true }
  )

  watch(
    () => confirmation.value,
    (value) => {
      if (value) {
        canDelete.value = true
      }
    },
    { deep: true }
  )
</script>
