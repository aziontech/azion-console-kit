<template>
  <div
    class="flex flex-col items-start w-full justify-center p-3 border-t surface-border sticky bottom-0 surface-section z-50 sm:flex-row sm:py-3 sm:px-8 sm:justify-between"
  >
    <div class="flex w-[283px]">
      <slot name="form" />
    </div>
    <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
      <PrimeButton
        severity="primary"
        outlined
        label="Back to list"
        @click="goBack"
      />
    </div>
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  export default {
    name: 'action-bar-block-go-back',
    components: {
      PrimeButton
    },
    methods: {
      goBack() {
        this.$router.go(-1)
      }
    }
  }
</script>
