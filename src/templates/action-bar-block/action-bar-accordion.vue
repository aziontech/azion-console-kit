<script setup>
  import { computed } from 'vue'
  import PrimeButton from 'primevue/button'

  defineOptions({ name: 'action-bar-block' })

  const emit = defineEmits(['onSubmit', 'onCancel'])

  const props = defineProps({
    loading: Boolean,
    inDrawer: Boolean,
    submitDisabled: Boolean,
    primaryActionLabel: { type: String, default: 'Save' }
  })

  const handleSubmit = () => {
    emit('onSubmit')
  }

  const calculateLoadIconByLoadingState = computed(() => {
    return props.loading ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabledSubmit = computed(() => {
    return props.submitDisabled || props.loading
  })

  const inDrawerStyles = computed(() => {
    return props.inDrawer
  })
</script>
<template>
  <div
    class="flex w-full gap-4 justify-end h-14 mt-6 items-center border-t surface-border bottom-0 surface-section z-50 px-2 md:px-8"
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
        class="flex gap-4 self-stretch items-center justify-end w-full"
        data-testid="form-actions-buttons"
      >
        <slot>
          <PrimeButton
            severity="primary"
            :label="props.primaryActionLabel"
            @click="handleSubmit"
            icon-pos="right"
            class="max-md:w-full"
            :icon="calculateLoadIconByLoadingState"
            :disabled="isDisabledSubmit"
            data-testid="form-actions-submit-button-accordion-1"
          />
        </slot>
      </div>
    </div>
  </div>
</template>
