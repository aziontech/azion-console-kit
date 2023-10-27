<template>
  <article
    class="flex flex-col surface-border border-l w-slide h-full absolute right-0 transform translate-x-full transition-transform duration-300 ease-in-out"
  >
    <!-- Title  -->
    <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
      <div class="text-color text-lg font-medium">Help</div>
      <PrimeButton
        icon="pi pi-times"
        outlined
        class="surface-border w-8 h-8"
        aria-label="Cancel"
        @click="closeHelpCenter"
      />
    </div>
    <div
      class="surface-border border border-dashed rounded-md flex items-center h-96 ml-6 mr-4 md:mr-8 my-3"
    >
      <p class="text-color text-sm font-medium text-center w-full">
        This section is under development.
      </p>
    </div>
  </article>
</template>
<script>
  import PrimeButton from 'primevue/button'
  import { mapActions } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'

  export default {
    name: 'SlideIn',
    components: {
      PrimeButton
    },
    methods: {
      ...mapActions(useHelpCenterStore, ['closeHelpCenter'])
    }
  }
</script>
