<template>
  <article
    class="flex flex-col surface border-l w-slide h-full absolute right-0 transform translate-x-full transition-transform duration-300 ease-in-out"
  >
    <!-- Title  -->
    <div class="flex w-full justify-between p-3 h-16 border-b">
      <div class="text-color text-lg font-bold">Help Center</div>
      <PrimeButton
        icon="pi pi-times"
        outlined
        style="height: 32px; width: 32px"
        aria-label="Cancel"
        @click="closeHelpeCenter"
      />
    </div>

    <!-- Search Input  -->
    <!-- <div class="flex justify-center p-3 border-b border-white">
      <div class="flex self-start">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
            class="w-[270px]"
            placeholder="Search articles..."
          />
        </span>
      </div>
    </div> -->

    <!-- Articles  -->
    <!-- <div class="flex flex-col p-3 gap-3 border-b border-white">
      <p class="text-gray-200 text-sm font-semibold">Recommended articles</p>
      <div class="flex justify-between">
        <span class="text-white text-opacity-90 text-sm font-normal"
          >Getting to know Real-Time Manager</span
        >
        <i class="pi pi-angle-right"></i>
      </div>
      <div class="flex justify-between">
        <span class="text-white text-opacity-90 text-sm font-normal">Getting started</span>
        <i class="pi pi-angle-right"></i>
      </div>
    </div> -->

    <!-- Documentation, API, Changelog,  Contact Support and Send Feedback  -->

    <!-- <div class="flex flex-col p-3 gap-4">
      <div class="flex justify-between items-center">
        <span class="text-white text-opacity-90 text-sm font-normal">Documentation</span>
        <i class="pi pi-external-link"></i>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-white text-opacity-90 text-sm font-normal">API</span>
        <i class="pi pi-external-link"></i>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-white text-opacity-90 text-sm font-normal">Changelog</span>
        <i class="pi pi-external-link"></i>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-white text-opacity-90 text-sm font-normal">Contact Support</span>
        <i class="pi pi-external-link"></i>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-white text-opacity-90 text-sm font-normal">Send Feedback</span>
        <i class="pi pi-external-link"></i>
      </div>
    </div> -->
  </article>
</template>
<script>
  import PrimeButton from 'primevue/button'

  export default {
    name: 'TestCenter',
    components: {
      PrimeButton
    },
    methods: {
      closeHelpeCenter() {
        this.$emit('closeRightSidebar')
      }
    }
  }
</script>
