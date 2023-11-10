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
      class="surface-border border border-dashed rounded-md items-center h-96 ml-6 mr-4 md:mr-8 my-3"
    >
      <PrimeButton
        v-for="(content, i) in mainContent"
        :key="i"
        @click="getHtmlArticle(content)"
        class="text-color text-sm font-medium text-center w-full"
        link
      >
        {{ content }}
      </PrimeButton>

      <div v-html="articleContent"></div>
    </div>
  </article>
</template>
<script>
  import PrimeButton from 'primevue/button'
  import { mapActions } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'
  import * as HelpCenterServices from '@/services/help-center-services'

  export default {
    name: 'SlideIn',
    components: {
      PrimeButton
    },
    data() {
      return {
        mainContent: '',
        articleContent: ''
      }
    },
    methods: {
      ...mapActions(useHelpCenterStore, ['closeHelpCenter']),
      async getMainContent() {
        const currentPath = this.getCurrentPath()

        this.mainContent = await HelpCenterServices.getHelpCenterDocumentationService({
          url: currentPath
        })
      },
      async getHtmlArticle(filename) {
        const currentPath = this.getCurrentPath()
        const parsedFilename = this.parseFilename(filename)

        this.articleContent = await this.fetchArticleContent(currentPath, parsedFilename)
      },
      getCurrentPath() {
        return window.location.pathname
      },
      parseFilename(filename) {
        const article = filename.replaceAll(' ', '-').toLowerCase()
        const [articleNameParsed] = article.split('#')

        return articleNameParsed.concat('/index.html')
      },
      async fetchArticleContent(currentPath, filename) {
        return await HelpCenterServices.getHelpCenterDocumentationService({
          url: currentPath,
          filename: filename
        })
      },
      onRouteChange() {
        this.getMainContent()
      }
    },
    mounted() {
      this.getMainContent()
    },
    watch: {
      $route: 'onRouteChange'
    }
  }
</script>
