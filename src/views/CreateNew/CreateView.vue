<script setup>
  import { inject, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'

  import PrimeButton from '@aziontech/webkit/button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import Sidebar from '@aziontech/webkit/sidebar'
  import { useToast } from '@aziontech/webkit/use-toast'

  import ContentBlock from '@/templates/content-block'
  // import PageHeadingBlock from '@/templates/page-heading-block'
  import TemplateEngineBlock from '@/templates/template-engine-block'
  import FormLoading from '@/templates/template-engine-block/form-loading.vue'

  import { useLoadingStore } from '@/stores/loading'
  import { useSolutionStore } from '@/stores/solution-create'
  import { scriptRunnerService } from '@/services/v2/script-runner'

  import ConsoleFeedback from '@/layout/components/navbar/feedback'

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

  // Only watch route.params changes, not query changes
  // This prevents reloading when query params change during deploy flow
  watch(
    () => ({ vendor: route.params.vendor, solution: route.params.solution }),
    (newParams, oldParams) => {
      // Only reload if params actually changed (not on query changes)
      if (
        newParams.vendor &&
        newParams.solution &&
        (newParams.vendor !== oldParams?.vendor || newParams.solution !== oldParams?.solution)
      ) {
        loadSolutionByVendor()
      }
    },
    { deep: true }
  )
</script>

<template>
  <ContentBlock>
    <template #heading>
      <div
        class="flex flex-col sm:flex-row gap-4 lg:items-center none"
        v-if="false"
      >
        <div class="flex flex-col sm:flex-row gap-4 sm:items-center">
          <div
            class="w-10 h-10 hidden rounded sm:flex border surface-border justify-center items-center overflow-hidden box-border"
          >
            <div class="bg-white flex h-full w-full rounded">
              <img
                class="object-contain"
                :src="solution.vendor.icon"
                alt=""
              />
            </div>
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
                size="small"
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
          label="View more details"
          severity="link"
          size="small"
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
          @cancel="handleCancel"
          @submitClick="handleSubmitClick"
          :getTemplateService="props.getTemplateService"
          :instantiateTemplateService="props.instantiateTemplateService"
          :getResultsService="scriptRunnerService.loadExecutionResultsService"
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
              <div
                class="w-10 h-10 rounded surface-border border flex justify-center items-center overflow-hidden box-border"
              >
                <div class="bg-white flex h-full w-full rounded">
                  <img
                    class="object-contain"
                    :src="solution.vendor.icon"
                    alt=""
                  />
                </div>
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
        <div class="flex flex-col gap-6 w-full px-3">
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
          <div class="flex">
            <div class="w-full flex flex-col gap-2">
              <div class="flex gap-2 items-center">
                <div
                  class="w-10 h-10 rounded surface-border border flex justify-center items-center overflow-hidden box-border"
                >
                  <div class="bg-white flex h-full w-full rounded">
                    <img
                      class="object-contain"
                      :src="solution.vendor.icon"
                      alt=""
                    />
                  </div>
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
                  <span class="text-xs font-medium text-color-secondary">{{
                    solution.version
                  }}</span>
                </div>
                <div class="flex gap-1">
                  <span class="text-xs font-medium text-color-primary">Last Updated</span>
                  <span class="text-xs font-medium text-color-secondary">{{
                    solution.lastUpdate
                  }}</span>
                </div>
              </div>
            </div>
            <div class="mr-2">
              <ConsoleFeedback />
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
