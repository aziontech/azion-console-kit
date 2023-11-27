<script setup>
  import { computed, onMounted, ref } from 'vue'
  import PrimeButton from 'primevue/button'
  defineOptions({ name: 'action-bar-block' })

  const emit = defineEmits(['onSubmit', 'onCancel'])
  const props = defineProps({
    loading: Boolean,
    cancelDisabled: Boolean,
    submitDisabled: Boolean
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

  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })
</script>
<template>
  <teleport
    to="#action-bar"
    v-if="isMounted"
  >
    <div
      class="flex flex-col items-start w-full justify-center p-3 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row sm:py-3 sm:px-8 sm:justify-between"
    >
      <div class="flex w-full justify-between max-w-screen-2xl mx-auto 2xl:px-8">
        <div class="flex w-[17.688rem]"></div>
        <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
          <PrimeButton
            severity="primary"
            label="Cancel"
            outlined
            class="max-md:min-w-max"
            @click="handleCancel"
            :disabled="isDisabledCancel"
          />
          <PrimeButton
            severity="primary"
            label="Save"
            @click="handleSubmit"
            icon-pos="right"
            class="max-md:w-full"
            :icon="calculateLoadIconByLoadingState"
            :disabled="isDisabledSubmit"
          />
        </div>
      </div>
    </div>
  </teleport>
</template>
