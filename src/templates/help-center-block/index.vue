<template>
  <div
    class="flex flex-col surface-border border-l w-slide h-full fixed right-0 transform translate-x-full transition-transform duration-300 ease-in-out"
  >
    <!-- Title  -->
    <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
      <h3 class="text-color text-lg font-medium">Help</h3>
      <PrimeButton
        icon="pi pi-times"
        outlined
        class="surface-border h-8 w-8"
        aria-label="Cancel"
        @click="closeHelpCenter"
      />
    </div>

    <!-- Content body -->
    <div class="h-full overflow-y-auto justify-between flex flex-col">
      <div>
        <div class="pr-7">
          <!-- Input Search  -->
          <div class="pl-6 mt-6">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText
                class="w-full"
                placeholder="Search articles..."
                v-model="search"
                @keyup.enter="searchDocumentation()"
              />
            </span>
          </div>

          <!-- List items -->
          <template v-if="!articleContent">
            <p class="pl-6 mb-2 mt-5 text-sm font-semibold">Recommended articles</p>
            <PrimeMenu
              :model="mainContent"
              class="w-full border-0 p-0 m-0 text-sm pl-4 pb-3 pt-2 bg-transparent"
            >
              <template #item="{ item }">
                <a
                  class="flex items-center h-[35px] cursor-pointer px-2"
                  @click="getHtmlArticle(item)"
                >
                  <span>{{ item }}</span>
                  <i class="pi pi-chevron-right text-sm ml-auto"></i>
                </a>
              </template>
            </PrimeMenu>
          </template>

          <!-- Article Content -->
          <div
            v-if="articleContent"
            class="pl-6 pt-6"
          >
            <PrimeButton
              outlined
              icon="pi pi-chevron-left"
              label="Back"
              @click="backToMenu()"
            ></PrimeButton>

            <article
              class="pt-4 prose dark:prose-invert"
              v-html="articleContent"
            ></article>
          </div>
        </div>

        <!-- Menu -->
        <div
          class="border-t surface-border"
          v-if="!articleContent"
        >
          <PrimeMenu
            :model="menuItems"
            class="w-full border-0 p-0 m-0 text-sm pl-4 pb-3 pr-7 pt-2 bg-transparent"
          >
            <template #item="{ item }">
              <a
                class="flex items-center h-[35px] cursor-pointer px-2"
                @click="goToMenuLink(item.link)"
              >
                <i
                  v-if="!item.isLinkExternal"
                  class="pi pi-send text-sm mr-2"
                ></i>
                <span>{{ item.label }}</span>
                <i
                  v-if="item.isLinkExternal"
                  class="pi text-sm ml-auto pi-external-link"
                ></i>
              </a>
            </template>
          </PrimeMenu>
        </div>
      </div>

      <div class="ml-6 mr-8 mb-20">
        <BannerDiscord v-if="!articleContent" />
      </div>
    </div>

    <!-- help mobile sidebar -->
    <Sidebar
      :visible="showHelp"
      position="bottom"
      headerContent="Help"
      :show-close-icon="false"
      :pt="{
        root: { class: '!h-[90%] md:hidden flex' },
        headerContent: { class: 'w-full' },
        mask: { class: 'md:hidden flex' },
        content: { class: '!p-0' }
      }"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <h2>Help</h2>
          <PrimeButton
            icon="pi pi-times"
            @click="closeHelpCenter"
            size="small"
            class="flex-none surface-border text-sm w-8 h-8"
            text
          />
        </div>
      </template>
      <!-- Content body -->
      <div class="h-full w-full justify-between flex flex-col">
        <div>
          <div>
            <!-- Input Search  -->
            <div class="mt-1 mb-5">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText
                  class="w-full"
                  placeholder="Search articles..."
                  v-model="search"
                  @keyup.enter="searchDocumentation()"
                />
              </span>
            </div>

            <!-- List items -->
            <template v-if="!articleContent">
              <div class="mb-2 pl-2 text-sm font-semibold">Recommended articles</div>
              <PrimeMenu
                :model="mainContent"
                class="w-full border-0 p-0 m-0 text-sm pb-3 pt-2 bg-transparent"
              >
                <template #item="{ item }">
                  <a
                    class="flex items-center h-[35px] cursor-pointer px-2"
                    @click="getHtmlArticle(item)"
                  >
                    <span>{{ item }}</span>
                    <i class="pi pi-chevron-right text-sm ml-auto"></i>
                  </a>
                </template>
              </PrimeMenu>
            </template>

            <!-- Article Content -->
            <div v-if="articleContent">
              <PrimeButton
                outlined
                icon="pi pi-chevron-left"
                label="Back"
                @click="backToMenu()"
              ></PrimeButton>

              <article
                class="pt-4 prose dark:prose-invert"
                v-html="articleContent"
              ></article>
            </div>
          </div>

          <div class="border-t surface-border -ml-[0.75rem] w-[calc(100%_+_24px)]"></div>
          <!-- Menu -->
          <template v-if="!articleContent">
            <PrimeMenu
              :model="menuItems"
              class="w-full border-0 p-0 m-0 text-sm pb-3 pt-2 bg-transparent"
            >
              <template #item="{ item }">
                <a
                  class="flex items-center h-[35px] cursor-pointer px-2"
                  @click="goToMenuLink(item.link)"
                >
                  <i
                    v-if="!item.isLinkExternal"
                    class="pi pi-send text-sm mr-2"
                  ></i>
                  <span>{{ item.label }}</span>
                  <i
                    v-if="item.isLinkExternal"
                    class="pi text-sm ml-auto pi-external-link"
                  ></i>
                </a>
              </template>
            </PrimeMenu>
          </template>
        </div>

        <div class="mb-20">
          <BannerDiscord v-if="!articleContent" />
        </div>
      </div>
    </Sidebar>
  </div>
</template>

<script>
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Sidebar from 'primevue/sidebar'
  import { mapActions, mapState } from 'pinia'
  import { useHelpCenterStore } from '@/stores/help-center'
  import BannerDiscord from './banner-discord.vue'
  import { getEnvironmentFromUrl, openSearchResult } from '@/helpers'

  import PrimeMenu from 'primevue/menu'

  export default {
    name: 'SlideIn',
    components: {
      PrimeButton,
      InputText,
      PrimeMenu,
      BannerDiscord,
      Sidebar
    },
    data() {
      return {
        mainContent: [],
        articleContent: '',
        search: '',
        menuItems: [
          {
            label: 'Documentation',
            link: 'https://www.azion.com/en/documentation',
            isLinkExternal: true
          },
          { label: 'API', link: 'https://api.azion.com', isLinkExternal: true },
          {
            label: 'Changelog',
            link: 'https://www.azion.com/en/documentation/products/changelog',
            isLinkExternal: true
          },
          {
            label: 'Contact Support',
            link: `${this.makeContactSupportUrl()}/tickets/`,
            isLinkExternal: true
          },
          {
            label: 'Send Feedback',
            link: 'mailto:feedback@azion.com',
            isLinkExternal: false
          }
        ],
        items: [
          {
            label: 'New',
            icon: 'pi pi-plus',
            shortcut: '⌘+N'
          },
          {
            label: 'Search',
            icon: 'pi pi-search',
            shortcut: '⌘+S'
          }
        ]
      }
    },
    methods: {
      ...mapActions(useHelpCenterStore, ['closeHelpCenter', 'closeHelpCenter']),
      async getMainContent() {
        const currentPath = this.getCurrentPath()

        const mainDocumentation = await this.HelpCenterServices.getHelpCenterDocumentationService({
          url: currentPath
        })

        this.mainContent = mainDocumentation
      },
      makeContactSupportUrl() {
        const environment = getEnvironmentFromUrl(window.location.href)
        if (environment === 'stage') {
          return 'https://stage-manager.azion.com'
        }

        return 'https://manager.azion.com'
      },
      async getHtmlArticle(filename) {
        const currentPath = this.getCurrentPath()
        const parsedFilename = this.parseFilename(filename)

        this.articleContent = await this.fetchArticleContent(currentPath, parsedFilename)
      },
      getCurrentPath() {
        return this.$route.path
      },
      parseFilename(filename) {
        const article = filename.replaceAll(' ', '-').toLowerCase()
        const [articleNameParsed] = article.split('#')

        return articleNameParsed.concat('/index.html')
      },
      async fetchArticleContent(currentPath, filename) {
        return await this.HelpCenterServices.getHelpCenterDocumentationService({
          url: currentPath,
          filename: filename
        })
      },
      onRouteChange() {
        this.getMainContent()
      },
      backToMenu() {
        this.articleContent = null
      },
      goToMenuLink(link) {
        window.open(link)
      },
      searchDocumentation() {
        openSearchResult(this.search)
      }
    },
    computed: {
      ...mapState(useHelpCenterStore, { showHelp: 'isOpen' })
    },
    watch: {
      $route: 'onRouteChange'
    }
  }
</script>
