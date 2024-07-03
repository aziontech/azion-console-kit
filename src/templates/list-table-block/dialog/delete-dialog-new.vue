<template>
  <PrimeDialog
    blockScroll
    modal
    visible
    :header="`Delete ${data.title}`"
    :draggable="false"
    class="max-w-2xl"
    @keyup.enter="removeItem()"
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
          This {{ data.title }} will be deleted along with any associated settings or instances.
          Check Help Center for more details.
        </p>
      </div>

      <div data-testid="delete-dialog-confirmation">
        <div
          class="flex flex-col w-full gap-2"
          data-testid="delete-dialog-confirmation-input"
        >
          <label
            for="confirm-input"
            class="font-semibold text-sm"
            data-testid="delete-dialog-confirmation-input-label"
            >Type “delete” to confirm:</label
          >
          <InputText
            id="confirm-input"
            type="text"
            autofocus
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
    confirmation: yup.string().equals(['delete'], '').required('This is a required field')
  })

  const { errors, meta, resetForm } = useForm({
    validationSchema,
    initialValues: {
      confirmation: ''
    }
  })

  const { value: confirmation } = useField('confirmation')

  const removeItem = async () => {
    if (!canDelete.value || !meta.value.valid) return

    loading.value = true
    try {
      const feedback = await data.deleteService(data.selectedID, data.selectedItemData)
      showToast('success', feedback ?? 'Deleted successfully!')
      emit('successfullyDeleted')
      resetForm()
    } catch (error) {
      showToast('error', 'Error', error)
    } finally {
      loading.value = false
    }
  }

  const showToast = (severity, summary, detail = '') => {
    toast.add({
      closable: true,
      severity,
      summary,
      detail
    })
  }

  const cancelDialog = () => {
    resetForm()
    dialogRef.value.close()
  }

  const getLoadingIcon = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabled = computed(() => {
    return !meta.value.valid || loading.value
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
