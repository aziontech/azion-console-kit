<script setup>
  import { computed, onUnmounted, ref, watch } from 'vue'
  import PrimeButton from 'primevue/button'
  import CardBox from '@aziontech/webkit/content/card-box'
  import ScriptRunnerBlock from '@/templates/script-runner-block'

  const props = defineProps({
    executionId: {
      type: String,
      required: true
    },

    getLogsService: {
      type: Function,
      required: true
    },
    results: {
      type: Object,
      default: null
    },
    deployFailed: {
      type: Boolean,
      default: false
    },
    applicationName: {
      type: String,
      default: ''
    },
    deployStartTime: {
      type: Number,
      default: null
    },
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
    showManageButton: {
      type: Boolean,
      default: true
    },
    showUrlButton: {
      type: Boolean,
      default: true
    },
    deployStarted: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['finish', 'retry', 'start-new', 'manage', 'open-url', 'next-step'])

  const timer = ref(0)
  const intervalRef = ref(null)

  const MINUTE_IN_SEC = 60
  const MILISEC_IN_SEC = 1000

  const isUnfinished = computed(() => {
    return !props.results && !props.deployFailed
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

  const domainId = computed(() => {
    return props.results?.domain?.id || null
  })

  const recoveryDismissed = ref(false)
  const showRecoveryActions = computed(() => props.deployFailed && !recoveryDismissed.value)

  const handleFinish = async () => {
    emit('finish')
  }

  const handleRetry = () => {
    recoveryDismissed.value = true
    emit('retry')
  }

  const handleStartNew = () => {
    recoveryDismissed.value = true
    emit('start-new')
  }

  watch(
    () => props.deployFailed,
    (failed) => {
      if (!failed) {
        recoveryDismissed.value = false
      }
    }
  )

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
    <CardBox
      title="Deployment"
      data-testid="deploy-status-card"
      :class="{ '[&>footer]:hidden': !showRecoveryActions }"
    >
      <template #header>
        <h2 class="text-heading-md text-[var(--text-default)]">Deployment</h2>
        <span
          v-if="isUnfinished"
          class="ml-auto text-sm font-normal text-color-secondary"
        >
          {{ elapsedTime }}
        </span>
      </template>

      <template #content>
        <div class="p-4 sm:p-6 flex flex-col gap-6">
          <ScriptRunnerBlock
            title="Deployment Logs"
            :getLogsService="props.getLogsService"
            :executionId="props.executionId"
            :start="props.deployStarted"
            @onFinish.once="handleFinish"
          />
        </div>
      </template>

      <template #footer>
        <div
          v-if="showRecoveryActions"
          class="flex flex-col sm:flex-row w-full gap-3"
        >
          <PrimeButton
            type="button"
            label="Start new deploy"
            severity="secondary"
            outlined
            class="w-full"
            data-testid="deploy-status-card__new-deploy-button"
            @click="handleStartNew"
          />
          <PrimeButton
            type="button"
            label="Retry deploy"
            severity="primary"
            class="w-full"
            data-testid="deploy-status-card__retry-button"
            @click="handleRetry"
          />
        </div>
      </template>
    </CardBox>
  </div>
</template>
