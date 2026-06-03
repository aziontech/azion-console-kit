<template>
  <PrimeDialog
    blockScroll
    modal
    visible
    :header="`Unbind ${data.title}`"
    :draggable="false"
    class="max-w-2xl"
    @keyup.enter="removeItem()"
    data-testid="unbind-dialog__header"
  >
    <div
      class="flex flex-col gap-6"
      data-testid="unbind-dialog__content__wrapper"
    >
      <div data-testid="unbind-dialog__warning__wrapper">
        <Message
          severity="warning"
          data-testid="unbind-dialog__warning__inline-message"
          title="Info Message"
          description="Once confirmed, this action can't be reversed."
        />

        <p
          class="pt-4 text-color-secondary"
          data-testid="unbind-dialog__warning__message-details"
        >
          This {{ data.title }} will be unbound from the {{ data.parent }}, along with any
          associated settings.
        </p>
      </div>

      <div data-testid="unbind-dialog__confirmation__wrapper">
        <div
          class="flex flex-col w-full gap-2"
          data-testid="unbind-dialog__confirmation-field__wrapper"
        >
          <label
            for="confirm-input"
            class="font-semibold text-sm"
            data-testid="unbind-dialog__confirmation-field__label"
            >Type “unbind” to confirm:</label
          >
          <InputText
            id="confirm-input"
            type="text"
            autofocus
            v-model="confirmation"
            :class="{ 'p-invalid': errors.confirmation }"
            data-testid="unbind-dialog__confirmation-field__input"
          />
          <small
            v-if="errors.confirmation"
            class="p-error text-xs font-normal leading-tight"
            data-testid="unbind-dialog__confirmation-field__error"
          >
            {{ errors.confirmation }}
          </small>
        </div>
      </div>
    </div>

    <template #closeicon>
      <IconButton
        kind="outlined"
        size="medium"
        @click="cancelDialog()"
        icon="pi pi-times"
        data-testid="unbind-dialog__close-icon__button"
        aria-label="unbind dialog__close icon__button"
      />
    </template>

    <template #footer>
      <Button
        kind="outlined"
        size="medium"
        label="Cancel"
        @click="cancelDialog()"
        data-testid="unbind-dialog__footer__cancel-button"
      />
      <Button
        kind="primary"
        size="medium"
        label="Unbind"
        @click="removeItem()"
        :loading="loading"
        :disabled="isDisabled"
        data-testid="unbind-dialog__footer__unbind-button"
        class="!bg-[var(--danger)] !text-[var(--danger-contrast)]"
      />
    </template>
  </PrimeDialog>
</template>

<script setup>
  import { computed, ref, inject } from 'vue'
  import { useField, useForm } from 'vee-validate'
  import { useToast } from '@aziontech/webkit/use-toast'
  import * as yup from 'yup'
  import Button from '@aziontech/webkit/button'
  import IconButton from '@aziontech/webkit/icon-button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import InputText from '@aziontech/webkit/inputtext'
  import Message from '@aziontech/webkit/message'

  defineOptions({ name: 'dialog-unbind' })

  const toast = useToast()
  const dialogRef = inject('dialogRef')

  const data = dialogRef.value.data
  const loading = ref(false)

  const validationSchema = yup.object({
    confirmation: yup
      .string()
      .required('This is a required field')
      .test('equals', '', (val) => {
        return val === 'unbind'
      })
  })

  const { errors, meta, resetForm } = useForm({
    validationSchema,
    initialValues: {
      confirmation: ''
    }
  })

  const { value: confirmation } = useField('confirmation')

  const removeItem = async () => {
    if (!meta.value.valid) return

    loading.value = true
    try {
      const feedback = await data.service(data.selectedID)
      showToast('success', 'Success', feedback ?? 'Unbound successfully!')
      resetForm()
      dialogRef.value.close({ updated: true })
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
    dialogRef.value.close({ updated: false })
  }

  const isDisabled = computed(() => {
    return !meta.value.valid || loading.value
  })
</script>
