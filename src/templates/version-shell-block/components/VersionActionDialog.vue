<script setup>
  import { ref, computed, watch } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'
  import TextArea from '@aziontech/webkit/textarea'

  defineOptions({ name: 'version-action-dialog' })

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    actionLabel: {
      type: String,
      required: true
    },
    requireComment: {
      type: Boolean,
      default: true
    },
    placeholder: {
      type: String,
      default: 'Add a comment...'
    },
    message: {
      type: String,
      default: ''
    },
    showComment: {
      type: Boolean,
      default: true
    },
    confirmSeverity: {
      type: String,
      default: 'primary'
    }
  })

  const emit = defineEmits(['confirm', 'update:visible'])

  const comment = ref('')

  watch(
    () => props.visible,
    (value) => {
      if (value) comment.value = ''
    }
  )

  const isConfirmDisabled = computed(() => {
    if (!props.showComment) return false
    if (!props.requireComment) return false
    return comment.value.trim().length === 0
  })

  const handleConfirm = () => {
    if (isConfirmDisabled.value) return
    emit('confirm', comment.value)
    emit('update:visible', false)
  }

  const handleCancel = () => {
    emit('update:visible', false)
  }
</script>

<template>
  <PrimeDialog
    :visible="visible"
    :blockScroll="true"
    modal
    class="w-full max-w-[var(--container-xl)]"
    :closable="false"
    @update:visible="emit('update:visible', $event)"
  >
    <template #header>
      <h5 class="text-heading-sm not-italic font-medium">{{ title }}</h5>
    </template>
    <div class="flex flex-col gap-[var(--spacing-2)]">
      <p
        v-if="message"
        class="text-body-sm"
        data-testid="version-action-dialog__message"
      >
        {{ message }}
      </p>
      <TextArea
        v-if="showComment"
        v-model="comment"
        rows="5"
        cols="60"
        :placeholder="placeholder"
        data-testid="version-action-dialog__comment"
      />
    </div>
    <template #footer>
      <PrimeButton
        severity="secondary"
        size="small"
        label="Cancel"
        outlined
        data-testid="version-action-dialog__cancel"
        @click="handleCancel"
      />
      <PrimeButton
        :severity="confirmSeverity"
        size="small"
        :label="actionLabel"
        :disabled="isConfirmDisabled"
        data-testid="version-action-dialog__confirm"
        @click="handleConfirm"
      />
    </template>
  </PrimeDialog>
</template>
