<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="hasApplicationName" />
    </template>
    <template #content>
      <div class="flex flex-col w-full gap-8">
        <PrimeCard class="w-full">
          <template #content>
            <div class="flex flex-col p-3 md:p-8 gap-8">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col md:flex-row md:items-center gap-3 w-full">
                  <div class="flex gap-3">
                    <Tag
                      v-if="isSuccessfullyFinished"
                      :icon="iconType"
                      :severity="severity"
                      :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-8 h-8' } }"
                    />
                    <span
                      class="text-primary text-xl whitespace-nowrap font-medium"
                      v-if="isUnfinished"
                    >
                      Project is being created
                    </span>

                    <span
                      class="text-primary text-xl whitespace-nowrap font-medium"
                      v-else-if="isSuccessfullyFinished"
                    >
                      {{ results.edge_application.name }}
                    </span>
                    <span
                      class="text-primary text-xl font-medium whitespace-nowrap"
                      v-else-if="deployFailed"
                    >
                      Creation failed
                    </span>
                  </div>
                  <div class="flex w-full justify-between flex-col-reverse gap-4 md:flex-row">
                    <PrimeButton
                      v-if="isSuccessfullyFinished"
                      link
                      :pt="{
                        root: { class: 'justify-center' },
                        label: { class: 'grow-0' }
                      }"
                      class="px-0 py-1"
                      :label="results.domain.url"
                      @click="goToUrl"
                      icon="pi pi-external-link"
                      iconPos="right"
                    />
                    <PrimeButton
                      v-if="isSuccessfullyFinished"
                      severity="secondary"
                      @click="goToEdgeApplicationEditView"
                      label="Manage"
                    />
                    <div class="md:ml-auto flex">
                      <PrimeButton
                        v-if="deployFailed"
                        @click="retry"
                        severity="secondary"
                        :pt="{
                          root: { class: 'justify-center' },
                          label: { class: 'grow-0' }
                        }"
                        class="md:ml-auto w-full"
                        label="Back"
                        icon="pi pi-chevron-left"
                        iconPos="left"
                      />
                    </div>
                  </div>
                </div>
                <span
                  class="text-sm font-normal text-color-secondary"
                  v-if="isUnfinished"
                >
                  {{ elapsedTime }}
                </span>
              </div>
              <ScriptRunnerBlock
                title="Deploy Log"
                :getLogsService="props.getLogsService"
                :executionId="executionId"
                @onFinish.once="handleFinish"
              />
            </div>
          </template>
        </PrimeCard>
        <div
          class="w-full flex flex-col gap-5"
          v-if="isSuccessfullyFinished"
        >
          <Divider
            align="left"
            type="dashed"
          >
            <b>Next Steps</b>
          </Divider>
          <div class="ml-0 mt-0 w-full max-w-screen-lg grid grid-cols-1 lg:grid-cols-3 gap-4">
            <PrimeButton
              v-for="(step, index) in nextSteps"
              :key="index"
              class="p-6 lg:h-36 w-full text-left h-auto items-start justify-start border-solid border surface-border hover:border-primary transition-all"
              link
              type="button"
              @click="step.handle"
            >
              <div class="flex flex-col justify-between gap-2 items-start">
                <div class="flex gap-3.5 flex-col">
                  <div class="flex gap-1 flex-col">
                    <span class="text-color text-base font-medium"> {{ step.title }} </span>
                    <span class="text-sm font-normal text-color-secondary line-clamp-2">
                      {{ step.description }}
                    </span>
                  </div>
                </div>
              </div>
            </PrimeButton>
          </div>
        </div>
      </div>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { computed, onMounted, onUnmounted, ref, inject } from 'vue'
  import Tag from 'primevue/tag'
  import Divider from 'primevue/divider'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import { useSolutionStore } from '@/stores/solution-create'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import ScriptRunnerBlock from '@/templates/script-runner-block'
  import PrimeCard from 'primevue/card'
  import { useToast } from 'primevue/usetoast'
  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  import { useDeploy } from '@/stores/deploy'

  const props = defineProps({
    getLogsService: {
      type: Function,
      required: true
    },
    getResultsService: {
      type: Function,
      required: true
    },
    windowOpen: {
      type: Function,
      required: true
    }
  })

  const deployStore = useDeploy()
  const executionId = ref('')
  const applicationName = ref('')
  const deployStartTime = ref()
  const intervalRef = ref()
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const results = ref()
  const timer = ref(0)
  const deployFailed = ref(false)
  const solutionStore = useSolutionStore()
  const failMessage =
    'There was an issue during the deployment. Check the Deploy Log for more details.'
  const successMessage =
    'The edge application is being propagated through the edge nodes. This process will take a few minutes.'
  const nextSteps = ref([
    {
      title: 'Customize Domain',
      description: 'Associate a custom domain and subdomains to Azion to handle user access.',
      handle: () => goToDomainEditView()
    },
    {
      title: 'Point Traffic',
      description:
        'Redirect the traffic of a domain to Azion and take advantage of the distributed network.',
      handle: () => goToPointTraffic()
    },
    {
      title: 'View Analytics',
      description: 'Gain powerful insights into your performance, availability, and security.',
      handle: () => goToAnalytics()
    }
  ])

  const handleFinish = async () => {
    try {
      const response = await props.getResultsService(route.params.id)
      deployStore.removeStartTime()
      results.value = response.result
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Created successfully',
        detail: successMessage
      })
    } catch (error) {
      deployFailed.value = true
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Creation Failed',
        detail: failMessage
      })
    }

    if (!solutionStore.solution) {
      return
    }

    if (deployFailed.value) {
      tracker.create.eventFailedDeployed(solutionStore.solution).track()
      return
    }

    if ('edge_application' in results.value) {
      handleTrackCreation()
    }
    tracker.create.eventDeployed(solutionStore.solution).track()
  }

  const severity = computed(() => {
    return !deployFailed.value ? 'success' : 'danger'
  })

  const iconType = computed(() => {
    return !deployFailed.value ? 'pi pi-check text-xs' : 'pi pi-times text-xs'
  })

  const isUnfinished = computed(() => {
    return !results.value && !deployFailed.value
  })

  const isSuccessfullyFinished = computed(() => {
    return results.value && !deployFailed.value
  })

  const MINUTE_IN_SEC = 60
  const elapsedTime = computed(() => {
    const isLessThanMinute = timer.value < MINUTE_IN_SEC

    if (isLessThanMinute) {
      return `Project started ${timer.value}s ago`
    }

    const seconds = timer.value % MINUTE_IN_SEC
    const minutes = Math.floor(timer.value / MINUTE_IN_SEC)

    return `Project started ${minutes}m${seconds}s ago`
  })

  const hasApplicationName = computed(() => {
    if (applicationName.value) return `Deploy: ${applicationName.value}`
    return 'Deploy'
  })

  const goToPointTraffic = () => {
    props.windowOpen(
      'https://www.azion.com/en/documentation/products/guides/point-domain-to-azion/',
      '_blank'
    )
  }

  const goToUrl = () => {
    props.windowOpen('https://' + results.value.domain.url, '_blank')
  }

  const goToAnalytics = () => {
    router.push({ name: 'real-time-metrics' })
  }

  const handleTrackCreation = () => {
    const trackerData = {
      productName: 'Edge Application',
      from: 'create',
      createdFrom: 'template',
      ...solutionStore?.solution
    }
    tracker.product.productCreated(trackerData).track()
  }

  const startTimer = () => {
    deployStartTime.value = deployStore.getStartTime
    const MILISEC_IN_SEC = 1000
    const timerInitialValue = Math.trunc((Date.now() - deployStartTime.value) / MILISEC_IN_SEC)
    timer.value = timerInitialValue
    intervalRef.value = setInterval(() => {
      timer.value += 1
    }, 1000)
  }

  const retry = () => {
    router.go(-1)
  }

  const goToEdgeApplicationEditView = () => {
    router.push(`/edge-applications/edit/${results.value.edge_application.id}`)
  }

  const goToDomainEditView = () => {
    router.push(`/domains/edit/${results.value.domain.id}`)
  }

  onMounted(() => {
    executionId.value = route.params.id
    applicationName.value = deployStore.getApplicationName
    startTimer()
  })

  onUnmounted(() => {
    clearInterval(intervalRef.value)
    deployStore.removeApplicationName()
  })
</script>
