<script setup>
  import { computed } from 'vue'
  import Button from '@aziontech/webkit/button'

  defineOptions({ name: 'action-bar-block' })

  const emit = defineEmits(['onSubmit', 'onCancel'])

  const props = defineProps({
    loading: Boolean,
    inDrawer: Boolean,
    cancelDisabled: Boolean,
    primaryActionLabel: { type: String, default: 'Save' },
    secondaryActionLabel: { type: String, default: 'Cancel' }
  })

  const handleSubmit = () => {
    emit('onSubmit')
  }

  const handleCancel = () => {
    emit('onCancel')
  }

  const isDisabledCancel = computed(() => props.cancelDisabled || props.loading)
  const isDisabledSubmit = computed(() => props.loading)
  const inDrawerStyles = computed(() => props.inDrawer)
</script>
<template>
  <div
    class="flex w-full gap-4 justify-end h-16 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-4 md:px-8"
    data-testid="form-actions-container"
  >
    <div
      class="flex w-full justify-content-end max-w-full 3xl:mx-auto"
      :class="{
        '2xl:px-0': inDrawerStyles,
        '2xl:px-0': !inDrawerStyles
      }"
      data-testid="form-actions-content"
    >
      <div
        class="flex gap-3 self-stretch items-center justify-end w-full"
        data-testid="form-actions-buttons"
      >
        <slot>
          <Button
            :label="props.secondaryActionLabel"
            :disabled="isDisabledCancel"
            kind="outlined"
            size="medium"
            data-testid="form-actions-cancel-button"
            @click="handleCancel"
          />
          <Button
            :label="props.primaryActionLabel"
            :loading="isDisabledSubmit"
            kind="primary"
            size="medium"
            data-testid="form-actions-submit-button"
            @click="handleSubmit"
          />
        </slot>
      </div>
    </div>
  </div>
</template>
