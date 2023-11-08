<template>
  <article
    class="flex flex-col surface-border border-l w-slide h-full fixed right-0 transform translate-x-full transition-transform duration-300 ease-in-out"
  >
    <!-- Title  -->
    <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
      <div class="text-color text-lg font-medium">Help</div>
      <PrimeButton
        icon="pi pi-times"
        outlined
        class="surface-border h-8 w-8"
        aria-label="Cancel"
        @click="closeHelpCenter"
      />
    </div>
    <div
      class="surface-border border border-dashed rounded-md flex items-center h-96 ml-6 mr-4 md:mr-8 my-3"
    >
      <p class="text-color text-sm font-medium text-center w-full">
        <iframe :src="'https://storage.googleapis.com/gcs-docs-help-center-stage/console/welcome/index.html'" frameborder="0"></iframe>
        <div v-html="mainContent">
        </div>
      </p>
    </div>
  </article>
</template>
<script>
  import PrimeButton from 'primevue/button'
  import { mapActions } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'
  import * as HomeServices from '@/services/home-services'

  export default {
    name: 'SlideIn',
    components: {
      PrimeButton
    },
    data() {
      return {
        mainContent: ''
      }
    },
    methods: {
      ...mapActions(useHelpCenterStore, ['closeHelpCenter']),
      async getMainContent() {
        this.mainContent = await HomeServices.getHelpCenterMainContentService()
      }
    },
    mounted() {
      this.getMainContent()
    }
  }
</script>
