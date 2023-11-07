<template>
  <div class="lg:w-[880px] sm:w-[85vw] min-h-[500px] flex p-8 gap-6">
    <PrimeMenu
      v-bind:model="items"
      :tabindex="selectedTab"
      class="bg-transparent border-none sm:min-w-[200px] p-0"
      :pt="{
        submenuHeader: {
          class: 'hidden'
        }
      }"
    />
    <div
      class="pb-4 h-full w-full gap-4 animate-pulse"
      v-if="isLoading"
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(288px, 1fr))"
    >
      <PrimeCard
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 gap-1 flex-col">
              <div class="bg-gray-200 h-5 w-40 rounded"></div>
              <div class="bg-gray-200 h-4 w-60 rounded"></div>
              <div class="bg-gray-200 h-4 w-50 rounded"></div>
              <div class="bg-gray-200 h-4 w-45 rounded"></div>
            </div>
            <div class="bg-gray-200 w-20 h-9 rounded"></div>
          </div>
        </template>
      </PrimeCard>
      <PrimeCard
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 gap-1 flex-col">
              <div class="bg-gray-200 h-5 w-40 rounded"></div>
              <div class="bg-gray-200 h-4 w-60 rounded"></div>
              <div class="bg-gray-200 h-4 w-50 rounded"></div>
              <div class="bg-gray-200 h-4 w-45 rounded"></div>
            </div>
            <div class="bg-gray-200 w-20 h-9 rounded"></div>
          </div>
        </template>
      </PrimeCard>
      <PrimeCard
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 gap-1 flex-col">
              <div class="bg-gray-200 h-5 w-40 rounded"></div>
              <div class="bg-gray-200 h-4 w-60 rounded"></div>
              <div class="bg-gray-200 h-4 w-50 rounded"></div>
              <div class="bg-gray-200 h-4 w-45 rounded"></div>
            </div>
            <div class="bg-gray-200 w-20 h-9 rounded"></div>
          </div>
        </template>
      </PrimeCard>
      <PrimeCard
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 gap-1 flex-col">
              <div class="bg-gray-200 h-5 w-40 rounded"></div>
              <div class="bg-gray-200 h-4 w-60 rounded"></div>
              <div class="bg-gray-200 h-4 w-50 rounded"></div>
              <div class="bg-gray-200 h-4 w-45 rounded"></div>
            </div>
            <div class="bg-gray-200 w-20 h-9 rounded"></div>
          </div>
        </template>
      </PrimeCard>
    </div>
    <div
      class="h-full w-full gap-4"
      v-if="!isLoading && selectedTab === 0"
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(288px, 1fr))"
    >
      <PrimeCard
        v-for="template in templates"
        :key="template.id"
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded flex justify-center items-center">
              <img
                class="rounded"
                :src="template.vendor.icon"
                alt=""
              />
            </div>
            <div class="flex p-0.5 flex-col">
              <span class="text-color text-base font-medium">
                {{ template.name }}
              </span>
              <span class="text-color-secondary">
                {{ template.headline }}
              </span>
            </div>
            <div>
              <PrimeButton
                outlined
                label="Choose"
              />
            </div>
          </div>
        </template>
      </PrimeCard>
    </div>
    <div
      class="h-full w-full gap-4"
      v-if="!isLoading && selectedTab === 1"
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(288px, 1fr))"
    >
      <PrimeCard
        v-for="template in browseTemplates"
        :key="template.id"
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded flex justify-center items-center">
              <img
                class="rounded"
                :src="template.vendor.icon"
                alt=""
              />
            </div>
            <div class="flex p-0.5 flex-col">
              <span class="text-color text-base font-medium">
                {{ template.name }}
              </span>
              <span class="text-color-secondary">
                {{ template.headline }}
              </span>
            </div>
            <div>
              <PrimeButton
                outlined
                label="Choose"
              />
            </div>
          </div>
        </template>
      </PrimeCard>
    </div>
    <div
      class="h-full w-full gap-4"
      v-if="!isLoading && selectedTab === 2"
      style="display: grid; grid-template-columns: repeat(auto-fit, minmax(288px, 1fr))"
    >
      <PrimeCard
        v-for="resource in resources"
        :key="resource.to"
        :pt="{
          root: 'w-72 p-4',
          body: 'w-full'
        }"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="flex p-0.5 flex-col">
              <span class="text-color text-base font-medium">
                {{ resource.label }}
              </span>
              <span class="text-color-secondary">
                Brief description lorem ipsum dolor sit amet, consectetur adipiscing elit
              </span>
            </div>
            <div>
              <PrimeButton
                outlined
                label="Choose"
                @click="redirect(resource.to)"
              />
            </div>
          </div>
        </template>
      </PrimeCard>
    </div>
  </div>
</template>
<script>
  import PrimeMenu from 'primevue/menu'
  import PrimeButton from 'primevue/button'
  import * as MarketplaceService from '@/services/marketplace-services'
  import PrimeCard from 'primevue/card'

  export default {
    name: 'create-modal-block',
    components: {
      PrimeMenu,
      PrimeCard,
      PrimeButton
    },
    async created() {
      await this.loadData()
    },
    data: () => ({
      isLoading: false,
      templates: [],
      browseTemplates: [],
      selectedTab: 0,
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
      items() {
        return [
          {
            label: 'Recommended for You',
            command: () => this.recommendedTemplates()
          },
          {
            label: 'Browse Templates',
            command: () => this.browse()
          },
          {
            label: 'New Resource',
            command: () => this.newResources()
          }
        ]
      }
    },
    methods: {
      recommendedTemplates() {
        this.selectedTab = 0
      },
      redirect(toLink) {
        this.$router.push(toLink)
        this.$emit('closeModal')
      },
      browse() {
        if (this.browseTemplates.length === 0) {
          this.loadBrowse()
        }
        this.selectedTab = 1
      },
      newResources() {
        this.selectedTab = 2
      },
      async loadData() {
        try {
          this.isLoading = true
          this.templates = await MarketplaceService.listSolutionsService()
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.isLoading = false
        }
      },
      async loadBrowse() {
        try {
          this.isLoading = true
          this.browseTemplates = await MarketplaceService.listSolutionsService()
        } catch (error) {
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error,
            life: 10000
          })
        } finally {
          this.isLoading = false
        }
      }
    }
  }
</script>
