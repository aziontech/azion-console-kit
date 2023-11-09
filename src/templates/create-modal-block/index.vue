<template>
  <div class="lg:w-[55rem] sm:w-[85vw] min-h-[32rem] flex flex-col sm:flex-row p-0 sm:p-8 gap-4 sm:gap-6">
    <div class="sm:min-w-[12rem]">
    <Listbox 
      :options="items"
      v-model="selectedTab"
      optionLabel="label"
      optionValue="value"
      :pt="{
        list:{ class:'p-0' }
      }"
      @change="changeTab"
      class="bg-transparent border-none sm:min-w-[12rem] p-0 md:fixed"
    />
  </div>
    <div
      class="pb-4 h-full ml-0 w-full grid md:grid-cols-2 grid-cols-1 gap-4 animate-pulse"
      v-if="isLoading"
    >
      <PrimeCard class="w-full p-4"
        v-for="skeletonItem of 6" :key="skeletonItem"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="w-10 h-10 rounded bg-gray-200"></div>
            <div class="flex p-0.5 gap-1 flex-col">
              <div class="bg-gray-200 h-5 w-40 rounded"></div>
              <div class="bg-gray-200 h-4 w-full rounded" v-for="skeletonLine of 3" :key="skeletonLine"></div>
            </div>
            <div class="bg-gray-200 w-20 h-9 rounded"></div>
          </div>
        </template>
      </PrimeCard>
    </div>
    <div
      class="h-full ml-0 w-full grid md:grid-cols-2 grid-cols-1 gap-4"
      v-else-if="showRecommended"
    >
      <PrimeCard
          v-for="template in templates"
          :key="template.id"
          :pt="{
            root: 'w-full p-4',
            body: 'w-full h-full',
            content: 'h-full',
          }"
        >
          <template #content>
            <div class="flex flex-col h-full justify-between gap-3.5 items-start">
              <div class="flex gap-3.5 flex-col">
                <div class="w-10 h-10 rounded flex justify-center items-center bg-white">
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
              </div>
              <PrimeButton
                outlined
                label="Choose"
              />
            </div>
          </template>
        </PrimeCard>
    </div>
    <div
      class="h-full w-full ml-0 grid md:grid-cols-2 grid-cols-1 gap-4"
      v-else-if="showBrowse"
    >
      <PrimeCard
          v-for="template in browseTemplates"
          :key="template.id"
          :pt="{
            root: 'w-full p-4',
            body: 'w-full h-full',
            content: 'h-full',
          }"
        >
          <template #content>
            <div class="flex flex-col h-full justify-between gap-3.5 items-start">
              <div class="flex gap-3.5 flex-col">
                <div class="w-10 h-10 rounded flex justify-center items-center bg-white">
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
              </div>
              <PrimeButton
                outlined
                label="Choose"
              />
            </div>
          </template>
        </PrimeCard>
    </div>
    <div
    class="h-full ml-0 w-full grid md:grid-cols-2 grid-cols-1 gap-4"
      v-if="showResource"
    >
      <PrimeCard
        v-for="resource in resources"
        :key="resource.to"
        class="w-full p-4"
      >
        <template #content>
          <div class="flex gap-3.5 flex-col">
            <div class="flex p-0.5 flex-col gap-1">
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
  import PrimeButton from 'primevue/button'
  import * as MarketplaceService from '@/services/marketplace-services'
  import Listbox from 'primevue/listbox';
  import PrimeCard from 'primevue/card'

  export default {
    name: 'create-modal-block',
    components: {
      PrimeCard,
      PrimeButton,
      Listbox
    },
    async created() {
      await this.loadData()
    },
    data: () => ({
      isLoading: false,
      templates: [],
      browseTemplates: [],
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
            label: 'Recommended for You',
            value: 'recommended'
          },
          {
            label: 'Browse Templates',
            value: 'browse'
          },
          {
            label: 'New Resource',
            value: 'new_resource'
          }
        ]
      }
    },
    methods: {
      changeTab() {
        if( this.selectedTab === 'browse') {
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
          this.templates = await MarketplaceService.listSolutionsService(this.recommendedHeader)
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
          this.browseTemplates = await MarketplaceService.listSolutionsService(this.browseHeader)
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
