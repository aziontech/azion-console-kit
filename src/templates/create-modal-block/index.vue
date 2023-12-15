<template>
  <div class="w-full h-full flex flex-col sm:flex-row p-0 sm:pl-5 sm:pr-8 gap-4 pb-4">
    <div class="sm:min-w-[240px] mt-4">
      <Listbox
        @change="onMenuChange"
        v-model="selectedTabControl"
        :options="items"
        optionLabel="label"
        :disabled="isLoading"
        optionValue="value"
        :pt="{
          list: { class: 'p-0' }
        }"
        class="bg-transparent border-none sm:min-w-[240px] p-0 md:fixed"
      />
    </div>

    <div class="w-full flex flex-col">
      <div v-if="!isLoading">
        <div
          class="text-base font-medium mt-5 mb-3"
          v-if="showResource"
        >
          Select a Resource
        </div>
        <div
          class="text-base font-medium mt-5 mb-3"
          v-else
        >
          Select a Template
        </div>
      </div>

      <LoadingListTemplate v-if="isLoading" />
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-if="showRecommended"
      >
        <PrimeButton
          v-for="template in templates"
          :key="template.id"
          @click="redirectToSolution(template)"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white"
              >
                <img
                  class="rounded"
                  :src="template.vendor.icon"
                  alt=""
                />
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.name }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ template.headline }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-else-if="showBrowse"
      >
        <PrimeButton
          v-for="template in browseTemplates"
          :key="template.id"
          @click="redirectToSolution(template)"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white"
              >
                <img
                  class="rounded"
                  :src="template.vendor.icon"
                  alt=""
                />
              </div>
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ template.name }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  {{ template.headline }}
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
      <div
        class="mx-0 w-full mt-0 grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4"
        v-else-if="showResource"
      >
        <PrimeButton
          v-for="resource in resources"
          :key="resource.to"
          @click="redirect(resource.to)"
          class="p-6 text-left border-solid border surface-border hover:border-primary transition-all"
          link
        >
          <div class="flex flex-col h-full justify-between gap-3.5 items-start">
            <div class="flex gap-3.5 flex-col">
              <div class="flex flex-col">
                <span class="line-clamp-1 h-5 text-color text-sm font-medium">
                  {{ resource.label }}
                </span>
                <span
                  class="h-10 pb-4 text-sm font-normal text-color-secondary mt-1.5 line-clamp-2"
                >
                  A description lorem ipsum dolor sit amet, consectetur adipiscing elit
                </span>
              </div>
            </div>
          </div>
        </PrimeButton>
      </div>
    </div>
  </div>
</template>
<script>
  import PrimeButton from 'primevue/button'
  import * as MarketplaceService from '@/services/marketplace-services'
  import LoadingListTemplate from './LoadingListTemplate'
  import Listbox from 'primevue/listbox'

  export default {
    name: 'create-modal-block',
    components: {
      PrimeButton,
      Listbox,
      LoadingListTemplate
    },
    async created() {
      await this.loadData()
    },
    data: () => ({
      isLoading: false,
      templates: [],
      browseTemplates: [],
      selectedTabControl: 'recommended',
      selectedTab: 'recommended',
      browHeader: 'browse-templates',
      recommendedHeader: 'recommended-for-you',
      resources: [
        {
          label: 'Domains',
          to: '/domains/create'
        },
        {
          label: 'Edge Application',
          to: '/edge-applications/create'
        },
        {
          label: 'Variables',
          to: '/variables/create'
        },
        {
          label: 'Intelligent DNS',
          to: '/intelligent-dns/create'
        },
        {
          label: 'Edge Firewall',
          to: '/edge-firewall/create'
        },
        {
          label: 'Edge Nodes',
          to: '/edge-node/create'
        },
        {
          label: 'Data Streaming',
          to: '/data-streaming/create'
        },
        {
          label: 'Edge Functions',
          to: '/edge-functions/create'
        },
        {
          label: 'Edge Services',
          to: '/edge-services/create'
        },
        {
          label: 'Digital Certificates',
          to: '/digital-certificates/create'
        },
        {
          label: 'Network Lists',
          to: '/network-lists/create'
        }
      ]
    }),
    computed: {
      showRecommended() {
        return this.selectedTab === 'recommended'
      },
      showBrowse() {
        return this.selectedTab === 'browse'
      },
      showResource() {
        return this.selectedTab === 'new_resource'
      },
      items() {
        return [
          {
            label: 'Recommended',
            value: 'recommended'
          },
          {
            label: 'Templates',
            value: 'browse'
          },
          {
            label: 'Resources',
            value: 'new_resource'
          }
        ]
      }
    },
    methods: {
      redirectToSolution(template) {
        this.showSidebar = false
        this.$router.push(`/create/${template.vendor.slug}/${template.slug}`)
        this.$emit('closeModal')
      },
      onMenuChange(target) {
        if (target.value === null) {
          this.selectedTabControl = this.selectedTab
        } else {
          this.selectedTab = target.value
        }
        if (target.value === 'browse') {
          if (this.browseTemplates.length === 0) {
            this.loadBrowse()
          }
        }
      },

      redirect(toLink) {
        this.$router.push(toLink)
        this.$emit('closeModal')
      },
      async loadData() {
        try {
          this.isLoading = true
          const payload = { type: this.recommendedHeader }
          this.templates = await MarketplaceService.listSolutionsService(payload)
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        } finally {
          this.isLoading = false
        }
      },
      async loadBrowse() {
        try {
          this.isLoading = true
          const payload = { type: this.browseHeader }
          this.browseTemplates = await MarketplaceService.listSolutionsService(payload)
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        } finally {
          this.isLoading = false
        }
      }
    }
  }
</script>
