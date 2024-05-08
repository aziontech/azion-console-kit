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
        :description="solution.headline"
        v-if="!isLoading"
      />
      <div
        class="flex flex-col sm:flex-row gap-4 sm:gap-6 lg:items-center"
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
                @click="goToVendorPage"
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
        <PrimeButton
          label="More details"
          severity="secondary"
          @click="openDetails"
        />
      </div>
    </template>
    <template #content>
      <FormLoading v-if="isLoading" />
      <form
        autocomplete="off"
        v-else
      >
        <TemplateEngineBlock
          :postCallbackUrlService="props.postCallbackUrlService"
          :listIntegrationsService="props.listIntegrationsService"
          :listPlatformsService="props.listPlatformsService"
          @cancel="handleCancel"
          @submitClick="handleSubmitClick"
          @instantiate="handleInstantiate"
          :getTemplateService="props.getTemplateService"
          :instantiateTemplateService="props.instantiateTemplateService"
          :templateId="solution.referenceId"
        />
      </form>

      <PrimeDialog
        :draggable="false"
        modal
        v-model:visible="showDetails"
        class="w-full max-w-2xl"
        :pt="{
          root: { class: ' w-full lg:max-w-screen-lg h-[640px]] hidden sm:flex' },
          mask: { class: 'hidden sm:flex' },
          content: { class: 'p-5 w-full' },
          header: { class: 'px-5 py-3 items-start' }
        }"
        position="center"
        :dismissableMask="true"
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
              <div class="flex items-center gap-1">
                <span class="text-xs font-medium text-color-primary">By</span>
                <PrimeButton
                  link
                  :pt="{
                    label: { class: 'text-xs' },
                    icon: { class: 'text-xs' }
                  }"
                  @click="goToVendorPage"
                  class="px-0 py-1"
                  :label="solution.vendor.name"
                  icon="pi pi-external-link"
                  iconPos="right"
                />
              </div>
              <div class="flex items-center gap-1">
                <span class="text-xs font-medium text-color-primary">Version</span>
                <span class="text-xs font-medium text-color-secondary">{{ solution.version }}</span>
              </div>
              <div class="flex items-center gap-1">
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
      </PrimeDialog>
      <Sidebar
        v-model:visible="showDetails"
        position="bottom"
        headerContent="Create"
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
                <span class="text-xs font-medium text-color-secondary">
                  {{ solution.vendor.name }}</span
                >
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
<script setup>
  import { useLoadingStore } from '@/stores/loading'
  import { useSolutionStore } from '@/stores/solution-create'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TemplateEngineBlock from '@/templates/template-engine-block'
  import FormLoading from '@/templates/template-engine-block/form-loading.vue'
  import PrimeButton from 'primevue/button'
  import PrimeDialog from 'primevue/dialog'
  import Sidebar from 'primevue/sidebar'
  import Skeleton from 'primevue/skeleton'
  import { useToast } from 'primevue/usetoast'
  import { inject, onMounted, ref, watchEffect } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const isLoading = ref(false)
  const showDetails = ref(false)
  const solution = ref({})
  const solutionTrackerData = ref({})
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()

  const store = useLoadingStore()

  const props = defineProps({
    getTemplateService: {
      type: Function,
      required: true
    },
    listPlatformsService: {
      type: Function,
      required: true
    },
    postCallbackUrlService: {
      type: Function,
      required: true
    },
    listIntegrationsService: {
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
    },
    windowOpen: {
      type: Function,
      required: true
    }
  })

  const solutionStore = useSolutionStore()

  const loadSolutionByVendor = async () => {
    try {
      store.startLoading()
      isLoading.value = true

      solution.value = await props.loadSolutionService({
        vendor: route.params.vendor,
        solution: route.params.solution
      })

      solutionTrackerData.value = {
        isv: solution.value.vendor.slug,
        version: solution.value.version,
        versionId: solution.value.latestVersionInstallTemplate,
        solutionId: solution.value.id,
        templateName: solution.value.name
      }
      solutionStore.setSolution(solutionTrackerData.value)
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    } finally {
      isLoading.value = false
      store.finishLoading()
    }
  }

  const handleCancel = () => {
    router.push('/')
  }

  const goToVendorPage = () => {
    props.windowOpen(solution.value.vendor.url, '_blank')
  }

  const openDetails = () => {
    tracker.create.clickMoreDetailsOnTemplate(solutionTrackerData.value).track()
    showDetails.value = true
  }

  const handleInstantiate = ({ result, applicationName }) => {
    router.push({
      path: `/create/deploy/${result.uuid}/${applicationName}`
    })
  }

  const handleSubmitClick = () => {
    tracker.create
      .eventClickedToDeploy({
        isv: solution.value.vendor.slug,
        version: solution.value.version,
        versionId: solution.value.latestVersionInstallTemplate,
        solutionId: solution.value.id,
        templateName: solution.value.name
      })
      .track()
  }

  onMounted(async () => {
    await loadSolutionByVendor()
  })

  watchEffect(() => {
    if (!route.params.vendor || !route.params.solution) {
      return
    }
    loadSolutionByVendor()
  })
</script>
