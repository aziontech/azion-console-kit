<template>
  <article
    class="flex flex-col surface border-l  w-slide h-full absolute right-0 transform translate-x-full transition-transform duration-300 ease-in-out"
  >
    <!-- Title  -->
    <div class="flex w-full justify-between p-3 h-16 border-b">
      <div class="text-color text-lg font-bold">Help</div>
      <PrimeButton
        icon="pi pi-times"
        outlined
        style="height: 32px; width: 32px"
        aria-label="Cancel"
        @click="closeHelpeCenter"
      />
    </div>
  
  </article>
</template>
<script>
  import PrimeButton from 'primevue/button'

  export default {
    name: 'TestHelper',
    components: {
      PrimeButton,
    },
    methods: {
      closeHelpeCenter() {
        this.$emit('closeRightSidebar')
      }
    }
  }
</script>
