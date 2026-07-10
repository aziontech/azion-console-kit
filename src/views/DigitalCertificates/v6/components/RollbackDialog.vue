<script setup>
  import { ref, computed } from 'vue'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'

  defineOptions({ name: 'digital-certificates-rollback-dialog' })

  const props = defineProps({
    visible: {
      type: Boolean,
      required: true
    },
    resource: {
      type: Object,
      default: null
    },
    targetVersion: {
      type: Object,
      default: null
    },
    rollbackService: {
      type: Function,
      required: true
    },
    resourceLabel: {
      type: String,
      default: 'certificate'
    }
  })

  const emit = defineEmits(['update:visible', 'success'])

  const toast = useToast()
  const isRollingBack = ref(false)

  const header = computed(() => `Rollback ${props.resourceLabel}`)

  const description = computed(() => {
    const name = props.resource?.name ?? `this ${props.resourceLabel}`
    const label = props.targetVersion?.label ?? 'the selected version'
    return `This creates a new current version of ${name} using the contents from ${label}. The current version is preserved in history.`
  })

  const close = () => {
    emit('update:visible', false)
  }

  const handleCancel = () => {
    if (isRollingBack.value) return
    close()
  }

  const reportError = (error) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }
    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail: error?.message ?? `Failed to roll back the ${props.resourceLabel}. Try again.`
    })
  }

  const handleRollback = async () => {
    if (isRollingBack.value) return
    if (!props.resource?.id || !props.targetVersion?.id) return

    isRollingBack.value = true
    try {
      const feedback = await props.rollbackService({
        id: props.resource.id,
        versionId: props.targetVersion.id
      })
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail: feedback
      })
      emit('success')
      close()
    } catch (error) {
      reportError(error)
    } finally {
      isRollingBack.value = false
    }
  }
</script>

<template>
  <PrimeDialog
    :visible="visible"
    :blockScroll="true"
    modal
    class="w-full max-w-[var(--container-xl)]"
    :closable="false"
    @update:visible="handleCancel"
  >
    <template #header>
      <h5 class="text-heading-sm not-italic font-medium">{{ header }}</h5>
    </template>

    <div
      v-if="targetVersion"
      class="flex flex-col gap-[var(--spacing-4)]"
    >
      <p
        class="text-body-sm text-[var(--text-color-secondary)]"
        data-testid="digital-certificates-rollback-dialog__description"
      >
        {{ description }}
      </p>
    </div>

    <template #footer>
      <PrimeButton
        severity="secondary"
        size="small"
        label="Cancel"
        outlined
        :disabled="isRollingBack"
        data-testid="digital-certificates-rollback-dialog__cancel"
        @click="handleCancel"
      />
      <PrimeButton
        severity="primary"
        size="small"
        label="Rollback"
        :loading="isRollingBack"
        :disabled="isRollingBack || !targetVersion"
        data-testid="digital-certificates-rollback-dialog__confirm"
        @click="handleRollback"
      />
    </template>
  </PrimeDialog>
</template>
