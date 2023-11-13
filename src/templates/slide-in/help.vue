<template>
  <div
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

    <!-- Content body -->
    <div class="h-full overflow-auto">
      <div class="pl-6 pr-8">
        <!-- Input Search  -->
        <div class="mt-6">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              class="w-full"
              placeholder="Search articles..."
              v-model="search"
            />
          </span>
        </div>

        <!-- List items -->
        <ul v-if="!articleContent" class="py-3">
          <li class="py-2 text-sm font-semibold">
            <span>Recommended articles</span>
          </li>
          <li
            class="flex items-center justify-between text-sm h-[35px] cursor-pointer hover:opacity-70"
            v-for="(item, i) in mainContent"
            :key="i"
            @click="getHtmlArticle(item)"
          >
            <span>{{ item }}</span>
            <i class="pi pi-chevron-right text-sm"></i>
          </li>
        </ul>

        <!-- Article Content -->
        <div v-if="articleContent" class="pt-6 ">
          <PrimeButton
            outlined
            icon="pi pi-chevron-left"
            label="Back"
            @click="backToMenu()"
          ></PrimeButton>

          <article class="pt-4 prose dark:prose-invert" v-html="articleContent"></article>
        </div>
      </div>

      <!-- Menu -->
      <div class="border-t surface-border">
        <ul class="pl-6 pr-8 pt-2">
          <li
            class="flex items-center justify-between text-sm h-[35px] cursor-pointer hover:opacity-70"
            v-for="(item, i) in menuItems"
            :key="i"
          >
            <span>{{ item.label }}</span>
            <i class="pi pi-external-link text-sm"></i>
          </li>

          <li class="flex items-center gap-2 text-sm h-[35px] cursor-pointer hover:opacity-70">
            <i class="pi pi-send text-sm"></i>
            <span>Send Feedback</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import { mapActions } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'
  import * as HelpCenterServices from '@/services/help-center-services'

  export default {
    name: 'SlideIn',
    components: {
      PrimeButton,
      InputText
    },
    data() {
      return {
        mainContent: '',
        articleContent: '',
        menuItems: [
          { label: 'Documentation', link: '' },
          { label: 'API', link: '' },
          { label: 'Changelog', link: '' },
          { label: 'Contact Support', link: '' }
        ]
      }
    },
    methods: {
      ...mapActions(useHelpCenterStore, ['closeHelpCenter']),
      async getMainContent() {
        const currentPath = this.getCurrentPath()

        const mainDocumentation = await HelpCenterServices.getHelpCenterDocumentationService({
          url: currentPath
        })

        this.mainContent = mainDocumentation
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
      },
      backToMenu() {
        this.articleContent = null
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
