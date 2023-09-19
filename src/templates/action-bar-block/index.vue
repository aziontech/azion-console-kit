<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
  class="flex flex-col items-start gap-4 justify-center sm:flex-row p-4 sm:p-6 w-full sm:justify-between border-t sticky bottom-0 surface-section z-50">
    <div class="flex w-[283px]">
      <slot name="form" />
    </div>
    <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
      <PrimeButton
        severity="primary"
        label="Cancel"
        outlined
        @click="handleCancel"
        :disabled="cancelDisabled"
      />
      <PrimeButton
        severity="primary"
        label="Submit"
        @click="handleSubmit"
        :loading="loading"
        :disabled="submitDisabled"
      />
    </div>
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  // Export my assets and components
  export default {
    name: 'ActionBarTemplate',
    components: {
      PrimeButton
    },
    props: {
      loading: {
        type: Boolean,
        required: false,
        default: false
      },
      cancelDisabled: {
        type: Boolean,
        required: false,
        default: false
      },
      submitDisabled: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    methods: {
      handleSubmit() {
        this.$emit('submit')
      },
      handleCancel() {
        this.$emit('cancel')
      }
    }
  }
</script>
