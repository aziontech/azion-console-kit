<script setup>
  import { computed } from 'vue'
  import PrimeButton from 'primevue/button'
  defineOptions({ name: 'action-bar-block' })

  const emit = defineEmits(['onSubmit', 'onCancel'])

  const props = defineProps({
    loading: Boolean,
    inDrawer: Boolean,
    cancelDisabled: Boolean,
    submitDisabled: Boolean,
    primaryActionLabel: { type: String, default: 'Save' },
    secondaryActionLabel: { type: String, default: 'Cancel' }
  })

  const handleSubmit = () => {
    emit('onSubmit')
  }

  const handleCancel = () => {
    emit('onCancel')
  }

  const calculateLoadIconByLoadingState = computed(() => {
    return props.loading ? 'pi pi-spin pi-spinner' : ''
  })

  const isDisabledSubmit = computed(() => {
    return props.submitDisabled || props.loading
  })

  const isDisabledCancel = computed(() => {
    return props.cancelDisabled || props.loading
  })

  const inDrawerStyles = computed(() => {
    return props.inDrawer
  })
</script>
<template>
  <div
    class="flex flex-col w-full justify-center items-center max-h-12 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row md:px-8 px-2 py-8 sm:justify-between"
  >
    <div
      class="flex w-full justify-content-end max-w-full 3xl:mx-auto"
      :class="{
        '2xl:px-0': inDrawerStyles,
        '2xl:px-0': !inDrawerStyles
      }"
    >
      <div class="flex gap-4 self-stretch items-center justify-end w-full">
        <PrimeButton
          severity="primary"
          :label="props.secondaryActionLabel"
          outlined
          class="max-md:min-w-max"
          @click="handleCancel"
          :disabled="isDisabledCancel"
        />
        <PrimeButton
          severity="primary"
          :label="props.primaryActionLabel"
          @click="handleSubmit"
          icon-pos="right"
          class="max-md:w-full"
          :icon="calculateLoadIconByLoadingState"
          :disabled="isDisabledSubmit"
        />
      </div>
    </div>
  </div>
</template>
