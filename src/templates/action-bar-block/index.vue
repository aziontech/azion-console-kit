<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="flex flex-col items-start w-full justify-center p-3 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row sm:py-3 sm:px-8 sm:justify-between"
  >
    <div class="flex w-full justify-between max-w-screen-2xl mx-auto 2xl:px-8">
      <div class="flex w-[17.688rem]">
        <slot name="form" />
      </div>
      <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
        <PrimeButton
          severity="primary"
          label="Cancel"
          outlined
          class="max-md:min-w-max"
          @click="handleCancel"
          :disabled="cancelDisabled"
        />
        <PrimeButton
          severity="primary"
          label="Save"
          @click="handleSubmit"
          icon-pos="right"
          class="max-md:w-full"
          :icon="calculateLoadIconByLoadingState"
          :disabled="isDisabled"
        />
      </div>
    </div>
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
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
    },
    computed: {
      calculateLoadIconByLoadingState() {
        return this.loading ? 'pi pi-spin pi-spinner' : ''
      },
      isDisabled() {
        return this.submitDisabled || this.loading
      }
    }
  }
</script>
