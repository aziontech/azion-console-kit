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
        @click="helpCenterStore.close()"
      />
    </div>

    <!-- Content body -->
    <div class="h-full flex justify-between flex-col">
      <div class="overflow-y-auto sticky top-12 h-[calc(100vh-5rem)] flex flex-col justify-between">
        <div class="mb-5">
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
              <small v-if="search">
                Search "<span class="font-semibold">{{ search }}</span
                >" on Documentation
              </small>
            </div>

            <!-- List items -->
            <template v-if="!currentArticleContent">
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
              v-if="currentArticleContent"
              class="pl-6 pt-6 mb-24"
            >
              <PrimeButton
                outlined
                icon="pi pi-chevron-left"
                label="Back"
                size="small"
                @click="backToMenu()"
              ></PrimeButton>

              <article
                class="pt-4 prose dark:prose-invert"
                v-html="currentArticleContent"
              ></article>
            </div>
          </div>

          <!-- Menu -->
          <div
            class="border-t surface-border"
            v-if="!currentArticleContent"
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
        <div
          class="ml-6 mr-8 mb-20"
          v-if="!currentArticleContent"
        >
          <BannerDiscord />
        </div>
      </div>
    </div>

    <!-- help mobile sidebar -->
    <Sidebar
      :visible="isOpen"
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
            @click="helpCenterStore.close()"
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
            <template v-if="!currentArticleContent">
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
            <div v-if="currentArticleContent">
              <PrimeButton
                outlined
                icon="pi pi-chevron-left"
                label="Back"
                @click="backToMenu()"
              />

              <article
                class="py-4 prose dark:prose-invert"
                v-html="currentArticleContent"
              />
            </div>
          </div>

          <div class="border-t surface-border -ml-[0.75rem] w-[calc(100%_+_24px)]"></div>
          <!-- Menu -->
          <template v-if="!currentArticleContent">
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

        <div
          class="mb-20"
          v-if="!currentArticleContent"
        >
          <BannerDiscord />
        </div>
      </div>
    </Sidebar>
  </div>
</template>

<script setup>
  import { getStaticUrlsByEnvironment, openSearchResult } from '@/helpers'
  import { getHelpCenterDocumentationService } from '@/services/help-center-services'
  import { useHelpCenterStore } from '@/stores/help-center'
  import { storeToRefs } from 'pinia'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import PrimeMenu from 'primevue/menu'
  import Sidebar from 'primevue/sidebar'
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import BannerDiscord from './banner-discord.vue'

  defineOptions({ name: 'SlideIn' })

  const helpCenterStore = useHelpCenterStore()
  const route = useRoute()

  const { getArticleContent } = storeToRefs(helpCenterStore)
  const articleContent = ref(null)

  const currentArticleContent = computed(() => {
    return getArticleContent.value || articleContent.value
  })

  const mainContent = ref([])
  const search = ref('')
  const menuItems = computed(() => [
    {
      label: 'Documentation',
      link: 'https://www.azion.com/en/documentation',
      isLinkExternal: true
    },
    { label: 'API', link: 'https://api.azion.com', isLinkExternal: true },
    {
      label: 'Release notes',
      link: 'https://www.azion.com/en/documentation/products/release-notes/',
      isLinkExternal: true
    },
    {
      label: 'Contact Support',
      link: `${makeContactSupportUrl()}/tickets/`,
      isLinkExternal: true
    },
    {
      label: 'Send Feedback',
      link: 'mailto:feedback@azion.com',
      isLinkExternal: false
    }
  ])

  const isOpen = computed(() => {
    return helpCenterStore.isOpen
  })

  const getMainContent = async () => {
    const currentPath = getCurrentPath()

    const { data } = await getHelpCenterDocumentationService({
      url: currentPath
    })

    mainContent.value = data
  }

  const makeContactSupportUrl = () => {
    return getStaticUrlsByEnvironment('manager')
  }

  const getHtmlArticle = async (filename) => {
    const currentPath = getCurrentPath()
    const parsedFilename = parseFilename(filename)

    articleContent.value = await fetchArticleContent(currentPath, parsedFilename)
  }

  const getCurrentPath = () => {
    const match = route.path.match(/(.*\/)(edit|solution)/)
    return match ? `${match[1]}${match[2]}` : route.path
  }

  const parseFilename = (filename) => {
    const article = filename.replaceAll(' ', '-').toLowerCase()
    const [articleNameParsed] = article.split('#')

    return articleNameParsed.concat('/index.html')
  }

  const fetchArticleContent = async (currentPath, filename) => {
    const { data } = await getHelpCenterDocumentationService({
      url: currentPath,
      filename: filename
    })

    return data
  }

  const onRouteChange = () => {
    getMainContent()
  }

  const backToMenu = () => {
    articleContent.value = null
    helpCenterStore.clearArticleContent()
  }

  const goToMenuLink = (link) => {
    window.open(link)
  }

  const searchDocumentation = () => {
    openSearchResult(search.value)
  }

  watch(route, () => {
    onRouteChange()
  })

  watch(isOpen, () => {
    if (!isOpen.value) {
      articleContent.value = null
    }
  })
</script>
