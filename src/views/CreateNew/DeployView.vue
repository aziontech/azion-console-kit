<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Deploy" />
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
                      v-if="!isUnfinished"
                      :icon="iconType"
                      :severity="severity"
                      :pt="{ icon: { class: 'mr-0' }, root: { class: 'w-8 h-8' } }"
                    />
                    <span
                      class="text-primary text-xl whitespace-nowrap font-medium"
                      v-if="isUnfinished"
                    >
                      Project is being deployed
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
                      Deploy failed
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
                      outlined
                      @click="goToEdgeApplicationEditView"
                      label="Manage"
                    />
                  </div>
                </div>
                <span
                  class="text-sm font-normal text-color-secondary"
                  v-if="isUnfinished"
                >
                  Project started {{ seconds }}s ago
                </span>
              </div>
              <ScriptRunnerBlock
                title="Deploy Log"
                :getLogsService="props.getLogsService"
                :executionId="executionId"
                @onFinish="handleFinish"
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
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import Tag from 'primevue/tag'
  import Divider from 'primevue/divider'
  import ContentBlock from '@/templates/content-block'
  import { useRoute, useRouter } from 'vue-router'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import ScriptRunnerBlock from '@/templates/script-runner-block'
  import PrimeCard from 'primevue/card'
  import { useToast } from 'primevue/usetoast'

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

  const executionId = ref('')
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const results = ref()
  const seconds = ref(0)
  const intervalRef = ref()
  const deployFailed = ref(false)
  const nextSteps = ref([
    {
      title: 'Customize Domain',
      description: 'Manage your Domain settings.',
      handle: () => goToDomainEditView()
    },
    {
      title: 'Point Traffic',
      description: 'See Point Traffic docs.',
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
      results.value = response.result
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Created successfully',
        detail: 'The project was deployed successfully'
      })
    } catch (error) {
      deployFailed.value = true
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Deploy failed',
        detail: error
      })
    }
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

  const goToPointTraffic = () => {
    props.windowOpen(
      'https://www.azion.com/en/documentation/products/guides/point-domain-to-azion/',
      '_blank'
    )
  }

  const goToUrl = () => {
    props.windowOpen('http://' + results.value.domain.url, '_blank')
  }

  const goToAnalytics = () => {
    //
  }

  const goToEdgeApplicationEditView = () => {
    router.push(`/edge-applications/edit/${results.value.edge_application.id}`)
  }

  const goToDomainEditView = () => {
    router.push(`/domains/edit/${results.value.domain.id}`)
  }

  onMounted(() => {
    intervalRef.value = setInterval(() => {
      seconds.value += 1
    }, 1000)
    executionId.value = route.params.id
  })

  onUnmounted(() => {
    clearInterval(intervalRef.value)
  })
</script>
