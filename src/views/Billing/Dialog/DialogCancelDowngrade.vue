<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="!isSubmitting"
    :draggable="false"
    :style="{ width: '576px', maxWidth: 'calc(100vw - 32px)' }"
    :pt="{
      root: { class: 'overflow-hidden rounded-md border border-default' },
      header: {
        class: 'h-14 border-b border-default bg-[var(--surface-50)] px-8'
      },
      title: { class: 'text-base font-semibold leading-[21px] text-default' },
      content: { class: 'bg-[var(--surface-100)] p-0' },
      footer: { class: 'h-14 border-t border-default bg-[var(--surface-50)] px-8 m-0' }
    }"
    header="Cancel Scheduled Downgrade"
  >
    <div class="flex flex-col gap-3.5 px-8 py-5">
      <p class="whitespace-pre-line text-[13px] leading-5 text-default">
        Confirm to remove the scheduled downgrade. Your current plan will continue without changes.
      </p>

      <InlineMessage
        v-if="error"
        severity="error"
        class="text-xs break-all"
      >
        {{ error }}
      </InlineMessage>
    </div>

    <template #footer>
      <div class="flex h-14 items-center justify-end gap-2">
        <Button
          outlined
          label="Cancel"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :disabled="isSubmitting"
          @click="close"
        />
        <Button
          :label="error ? 'Retry' : 'Keep current plan'"
          :loading="isSubmitting"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :disabled="isSubmitting"
          @click="confirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import Dialog from '@aziontech/webkit/dialog'
  import Button from '@aziontech/webkit/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  defineOptions({ name: 'dialog-cancel-downgrade' })

  const props = defineProps({
    visible: { type: Boolean, default: false }
  })

  const emit = defineEmits(['update:visible', 'confirm'])

  const isSubmitting = ref(false)
  const error = ref('')

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => {
      if (!value) error.value = ''
      emit('update:visible', value)
    }
  })

  const close = () => {
    if (isSubmitting.value) return
    isVisible.value = false
  }

  const confirm = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    error.value = ''
    try {
      await new Promise((resolve, reject) => {
        emit('confirm', {
          done: resolve,
          fail: (err) =>
            reject(typeof err === 'string' ? new Error(err) : err || new Error('Failed'))
        })
      })
      isVisible.value = false
    } catch (err) {
      error.value =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to cancel scheduled downgrade. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }
</script>
