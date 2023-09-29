<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div
    class="flex flex-col items-start gap-4 justify-center sm:flex-row p-4 sm:p-6 w-full sm:justify-between border-t sticky bottom-0 surface-section z-50"
  >
    <div class="flex w-[283px]">
      <slot name="form" />
    </div>
    <div class="flex gap-4 self-stretch items-center max-sm:justify-end">
      <PrimeButton
        severity="primary"
        label="Ok"
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
