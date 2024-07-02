<template>
  <PrimeDialog
    v-model:visible="deleteDialogVisible"
    modal
    :header="`Delete ${informationForDeletion.title}`"
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
          This {{ informationForDeletion.title }} will be deleted along with any associated settings
          or instances. Check Help Center for more details.
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
        :icon="calculateLoadIconByLoadingState"
        :disabled="isDisabled"
        data-testid="delete-dialog-footer-delete-button"
      ></PrimeButton>
    </template>
  </PrimeDialog>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Message from 'primevue/message'
  import { useToast } from 'primevue/usetoast'
  import { useField, useForm } from 'vee-validate'
  import { computed, ref, watch } from 'vue'
  import * as yup from 'yup'

  const toast = useToast()

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

  const emit = defineEmits(['successfullyDeleted'])
  const props = defineProps({
    informationForDeletion: {
      type: Object,
      required: true
    }
  })

  const loading = ref(false)
  const canDelete = ref(false)
  const deleteDialogVisible = ref(false)

  const removeItem = async () => {
    if (canDelete.value === false) return
    if (!meta.value.valid) return

    loading.value = true
    let toastConfig = {
      closable: true,
      severity: 'success',
      summary: ''
    }

    try {
      const feedback = await props.informationForDeletion.deleteService(
        props.informationForDeletion.selectedID,
        props.informationForDeletion.selectedItemData
      )
      toastConfig.summary = feedback ?? 'Successfully deleted!'
      emit('successfullyDeleted')
      resetForm()
    } catch (error) {
      toastConfig = {
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error
      }
    } finally {
      deleteDialogVisible.value = false
      toast.add(toastConfig)
      loading.value = false
    }
  }

  const cancelDialog = () => {
    deleteDialogVisible.value = false
    resetForm()
  }

  const calculateLoadIconByLoadingState = computed(() => {
    return loading.value ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabled = computed(() => {
    return !meta.value.valid || loading.value
  })

  watch(
    () => props.informationForDeletion,
    (value) => {
      if (value) {
        canDelete.value = false
        resetForm()
        deleteDialogVisible.value = props.informationForDeletion.deleteDialogVisible
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
