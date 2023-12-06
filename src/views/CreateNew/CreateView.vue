<template>
  <ContentBlock>
    <template #heading>
      <div
        class="flex flex-col gap-4"
        v-if="isLoading"
      >
        <div class="flex gap-3">
          <Skeleton class="h-4 w-10" />
          <Skeleton class="h-4 w-24" />
        </div>
        <Skeleton class="h-9 w-64" />
        <div class="flex gap-4">
          <Skeleton class="hidden sm:flex w-10 h-10" />
          <div class="flex flex-col gap-4 sm:flex-row w-full">
            <div class="flex items-center gap-3">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-4 w-36" />
            </div>
            <Skeleton class="sm:ml-auto h-9 sm:w-28" />
          </div>
        </div>
      </div>
      <PageHeadingBlock
        :pageTitle="solution.name"
        v-if="!isLoading"
      />
      <div
        class="flex flex-col sm:flex-row gap-4 lg:items-center"
        v-if="!isLoading"
      >
        <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div class="w-10 h-10 hidden rounded sm:flex justify-center items-center bg-white">
            <img
              class="rounded"
              :src="solution.vendor.icon"
              alt=""
            />
          </div>
          <div class="flex gap-3 items-center">
            <div class="flex gap-1 items-center">
              <span class="text-xs font-medium text-color-primary">By</span>
              <PrimeButton
                link
                :pt="{
                  label: { class: 'text-xs' },
                  icon: { class: 'text-xs' }
                }"
                class="px-0 py-1"
                :label="solution.vendor.name"
                icon="pi pi-external-link"
                iconPos="right"
              />
            </div>
            <div class="flex gap-1 items-center">
              <span class="text-xs font-medium text-color-primary">Version</span>
              <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
            </div>
            <div class="flex gap-1 items-center">
              <span class="text-xs font-medium text-color-primary">Last Updated</span>
              <span class="text-xs font-medium text-color-secondary">{{
                solution.lastUpdate
              }}</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row ml-0 sm:ml-auto">
          <PrimeButton
            label="More details"
            outlined
            @click="openDetails"
          />
        </div>
      </div>
    </template>
    <template #content>
      <FormLoading v-if="isLoading" />
      <TemplateEngineBlock
        v-else
        @instantiate="handleInstantiate"
        :getTemplateService="getTemplateService"
        :instantiateTemplateService="instantiateTemplateService"
        :templateId="solution.referenceId"
      />
      <PrimeDialog
        modal
        v-model:visible="showDetails"
        class="w-full max-w-2xl"
        :pt="{
          root: { class: 'hidden sm:flex' },
          mask: { class: 'hidden sm:flex' },
          content: { class: 'p-5' },
          header: { class: 'px-5 py-3 items-start' }
        }"
        position="center"
        :dismissableMask="true"
        :breakpoints="{ '641px': '90vw' }"
      >
        <template #header>
          <div class="w-full flex flex-col gap-2">
            <div class="flex gap-2 items-center">
              <div class="w-10 h-10 rounded flex justify-center items-center bg-white">
                <img
                  class="rounded"
                  :src="solution.vendor.icon"
                  alt=""
                />
              </div>
              <span class="text-xl font-medium">
                {{ solution.name }}
              </span>
            </div>
            <div class="flex gap-3">
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">By</span>
                <span class="text-xs font-medium text-color-secondary">{{
                  solution.vendor.name
                }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Version</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Last Updated</span>
                <span class="text-xs font-medium text-color-secondary">{{
                  solution.lastUpdate
                }}</span>
              </div>
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-6 max-w-2xl">
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium"> Overview </span>
            <div
              class="bg-transparent"
              v-html="solution.overview"
            ></div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium"> Usage </span>
            <div
              class="bg-transparent"
              v-html="solution.usage"
            ></div>
          </div>
        </div>
      </PrimeDialog>
      <Sidebar
        v-model:visible="showDetails"
        position="bottom"
        headerContent="Create something new"
        :show-close-icon="true"
        :pt="{
          root: { class: 'h-[80%] flex p-0 sm:hidden' },
          headerContent: { class: 'w-full' },
          header: { class: 'px-3 py-2 items-start' },
          mask: { class: 'flex sm:hidden' }
        }"
      >
        <template #header>
          <div class="w-full flex flex-col gap-2">
            <div class="flex gap-2 items-center">
              <div class="w-10 h-10 rounded flex justify-center items-center bg-white">
                <img
                  class="rounded"
                  :src="solution.vendor.icon"
                  alt=""
                />
              </div>
              <span class="text-xl font-medium">
                {{ solution.name }}
              </span>
            </div>
            <div class="flex gap-3">
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">By</span>
                <span class="text-xs font-medium text-color-secondary">{{
                  solution.vendor.name
                }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Version</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
              </div>
              <div class="flex gap-1">
                <span class="text-xs font-medium text-color-primary">Last Updated</span>
                <span class="text-xs font-medium text-color-secondary">{{
                  solution.lastUpdate
                }}</span>
              </div>
            </div>
          </div>
        </template>
        <div class="flex flex-col gap-6 w-full">
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium"> Overview </span>
            <div
              class="bg-transparent"
              v-html="solution.overview"
            ></div>
          </div>
          <div class="flex flex-col gap-2">
            <span class="text-lg font-medium"> Usage </span>
            <div
              class="bg-transparent"
              v-html="solution.usage"
            ></div>
          </div>
        </div>
      </Sidebar>
    </template>
  </ContentBlock>
</template>
<script>
  import TemplateEngineBlock from '@/templates/template-engine-block'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import ContentBlock from '@/templates/content-block'
  import Sidebar from 'primevue/sidebar'
  import Skeleton from 'primevue/skeleton'
  import FormLoading from '@/templates/template-engine-block/FormLoading'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { loadingStore } from '@/stores/loading'

  export default {
    components: {
      TemplateEngineBlock,
      ContentBlock,
      PageHeadingBlock,
      PrimeButton,
      PrimeDialog,
      Sidebar,
      Skeleton,
      FormLoading
    },
    data: () => ({
      isLoading: false,
      showDetails: false,
      solution: {}
    }),
    props: {
      getTemplateService: {
        type: Function,
        required: true
      },
      instantiateTemplateService: {
        type: Function,
        required: true
      },
      loadSolutionService: {
        type: Function,
        required: true
      }
    },

    async created() {
      const dispatchLoading = loadingStore()
      dispatchLoading.setLoading()
      await this.loadSolution()
      dispatchLoading.hideLoading()
    },
    methods: {
      async loadSolution() {
        try {
          this.isLoading = true
          this.solution = await this.loadSolutionService({
            vendor: this.$route.params.vendor,
            solution: this.$route.params.solution
          })
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
      openDetails() {
        this.showDetails = true
      },
      handleInstantiate(element) {
        this.$router.push(`/deploy/${element.uuid}`)
      }
    }
  }
</script>
