<script setup>
  import { openSearchResult, windowOpen } from '@/helpers'
  import DiscordLogo from '@assets/svg/discord-logo'
  import { useHelperCenter } from '@/composables/use-helper-center'
  import { useLayout } from '@/composables/use-layout'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import PrimeMenu from 'primevue/menu'
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  defineOptions({
    name: 'helper-sidebar'
  })

  const { closeSidebar, isSidebarActive, OpenSidebarComponent } = useLayout()
  const { getters, actions } = useHelperCenter()

  const route = useRoute()

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
      label: 'Get Assistance (Support)',
      link: 'https://azion.freshworks.com/login/auth/1621629799053?client_id=41441690836303948&redirect_uri=https://tickets.azion.com/freshid/customer_authorize_callback',
      isLinkExternal: true
    }
  ])

  const searchDocumentation = () => {
    openSearchResult(search.value)
  }

  const clickMenuItem = (item) => {
    if (item.link) {
      windowOpen(item.link)
    } else if (item.open) {
      OpenSidebarComponent(item.open)
    }
  }

  const currentArticleContent = computed(() => {
    return getters.getArticleContent.value
  })

  const backToMenu = () => {
    actions.clearArticleContent()
  }

  watch(route, () => {
    actions.updatedMainContent()
  })

  watch(isSidebarActive, () => {
    if (!isSidebarActive) {
      actions.clearArticleContent()
    }
  })

  onMounted(() => {
    actions.updatedMainContent()
  })
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-3.5rem)]">
    <div class="flex w-full justify-between pl-6 md:pr-8 pr-3 py-3 border-b surface-border">
      <h3 class="text-color text-lg font-medium">Help</h3>
      <PrimeButton
        icon="pi pi-times"
        outlined
        class="surface-border h-8 w-8"
        aria-label="Cancel"
        v-tooltip.bottom="'Close'"
        @click="closeSidebar"
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
                :model="getters.getMainContent.value"
                class="w-full border-0 p-0 m-0 text-sm pl-4 pb-3 pt-2 bg-transparent"
              >
                <template #item="{ item }">
                  <a
                    class="flex items-center h-[35px] cursor-pointer px-2"
                    @click="getters.getHtmlArticle(item)"
                  >
                    <span>{{ item }}</span>
                    <i class="pi pi-chevron-right text-sm ml-auto"></i>
                  </a>
                </template>
              </PrimeMenu>
            </template>

            <!-- Article Content -->
            <div
              v-else
              class="pl-6 pt-6 mb-24"
            >
              <PrimeButton
                outlined
                icon="pi pi-chevron-left"
                label="Back"
                size="small"
                @click="backToMenu"
              />

              <article
                class="pt-4 prose dark:prose-invert"
                v-html="currentArticleContent"
              />
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
                  @click="clickMenuItem(item)"
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
          <div class="p-6 mt-2 rounded bg-gray-900 bg-header relative overflow-hidden">
            <div class="flex flex-col items-start gap-4 max-w-xs w-full">
              <h1 class="text-white text-sm leading-7 w-2/3">
                Connect and build together with the Azion Community.
              </h1>

              <a
                href="https://discord.com/invite/Yp9N7RMVZy"
                class="p-button gap-2"
                icon="pi pi-discord"
                target="_blank"
              >
                <i class="pi pi-discord"></i>
                Join Discord</a
              >
            </div>
            <DiscordLogo />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
