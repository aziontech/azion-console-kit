<script setup>
  import { computed, onUnmounted, ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import BaseDeployCard from './BaseDeployCard.vue'
  import ScriptRunnerBlock from '@/templates/script-runner-block'

  const props = defineProps({
    // Execution ID for the script runner
    executionId: {
      type: String,
      required: true
    },

    // Service to get logs
    getLogsService: {
      type: Function,
      required: true
    },

    // Results from deploy (populated after finish)
    results: {
      type: Object,
      default: null
    },

    // Deploy failed state
    deployFailed: {
      type: Boolean,
      default: false
    },

    // Application name for heading
    applicationName: {
      type: String,
      default: ''
    },

    // Deploy start time (timestamp)
    deployStartTime: {
      type: Number,
      default: null
    },

    // Labels
    deployLabel: {
      type: String,
      default: 'Deploy'
    },
    manageLabel: {
      type: String,
      default: 'Manage'
    },
    backLabel: {
      type: String,
      default: 'Back'
    },

    // Button visibility
    showManageButton: {
      type: Boolean,
      default: true
    },
    showUrlButton: {
      type: Boolean,
      default: true
    },

    // Deploy control
    deployStarted: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['finish', 'retry', 'manage', 'open-url', 'next-step'])

  const timer = ref(0)
  const intervalRef = ref(null)

  const MINUTE_IN_SEC = 60
  const MILISEC_IN_SEC = 1000

  const isUnfinished = computed(() => {
    return !props.results && !props.deployFailed
  })

  const isSuccessfullyFinished = computed(() => {
    return props.results && !props.deployFailed
  })

  const elapsedTime = computed(() => {
    if (!timer.value) {
      return 'Start deploying to see the progress here'
    }
    const isLessThanMinute = timer.value < MINUTE_IN_SEC

    if (isLessThanMinute) {
      return `Project started ${timer.value}s ago`
    }

    const seconds = timer.value % MINUTE_IN_SEC
    const minutes = Math.floor(timer.value / MINUTE_IN_SEC)

    return `Project started ${minutes}m${seconds}s ago`
  })

  const hasApplicationName = computed(() => {
    if (props.applicationName) return `Deploy: ${props.applicationName}`
    return 'Deployment'
  })

  const domainUrl = computed(() => {
    return props.results?.domain?.url || ''
  })

  const edgeApplicationId = computed(() => {
    return props.results?.edgeApplication?.id || null
  })

  const domainId = computed(() => {
    return props.results?.domain?.id || null
  })

  const handleFinish = async () => {
    emit('finish')
  }

  const retry = () => {
    emit('retry')
  }

  const goToUrl = () => {
    emit('open-url', domainUrl.value)
  }

  const goToEdgeApplicationEditView = () => {
    emit('manage', { type: 'edgeApplication', id: edgeApplicationId.value })
  }

  const goToDomainEditView = () => {
    emit('manage', { type: 'domain', id: domainId.value })
  }

  const startTimer = () => {
    const timerInitialValue =
      props.deployStartTime !== null
        ? Math.trunc((Date.now() - props.deployStartTime) / MILISEC_IN_SEC)
        : 0

    timer.value = timerInitialValue
    intervalRef.value = setInterval(() => {
      timer.value += 1
    }, 1000)
  }

  const stopTimer = () => {
    if (intervalRef.value) {
      clearInterval(intervalRef.value)
      intervalRef.value = null
    }
  }

  watch(
    () => props.deployStarted,
    (newVal) => {
      if (newVal && !intervalRef.value) {
        startTimer()
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    stopTimer()
  })

  defineExpose({
    timer,
    startTimer,
    stopTimer,
    hasApplicationName,
    goToDomainEditView
  })
</script>

<template>
  <div class="flex flex-col w-full gap-8">
    <BaseDeployCard :title="hasApplicationName">
      <template #header-right>
        <span v-if="isUnfinished">
          {{ elapsedTime }}
        </span>
      </template>

      <template #content>
        <ScriptRunnerBlock
          title="Deployment Logs"
          :getLogsService="props.getLogsService"
          :executionId="props.executionId"
          :start="props.deployStarted"
          @onFinish.once="handleFinish"
        />

        <div class="flex w-full justify-end">
          <div class="flex sm:flex-row flex-col gap-3 md:gap-4">
            <PrimeButton
              v-if="isSuccessfullyFinished && showUrlButton && domainUrl"
              link
              icon="pi pi-external-link"
              iconPos="right"
              size="small"
              class="px-0 py-1"
              :label="domainUrl"
              :pt="{
                root: { class: 'justify-center' },
                label: { class: 'grow-0 truncate' }
              }"
              @click="goToUrl"
            />
            <div class="flex justify-end">
              <PrimeButton
                v-if="isSuccessfullyFinished && showManageButton && edgeApplicationId"
                :label="manageLabel"
                severity="secondary"
                size="small"
                @click="goToEdgeApplicationEditView"
              />
            </div>
            <div
              v-if="deployFailed"
              class="md:ml-auto flex"
            >
              <PrimeButton
                @click="retry"
                severity="secondary"
                :pt="{
                  root: { class: 'justify-center' },
                  label: { class: 'grow-0' }
                }"
                class="md:ml-auto w-full"
                :label="backLabel"
                icon="pi pi-chevron-left"
                iconPos="left"
              />
            </div>
          </div>
        </div>
      </template>
    </BaseDeployCard>
  </div>
</template>
