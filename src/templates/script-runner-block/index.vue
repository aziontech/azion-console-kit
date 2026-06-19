<template>
  <Accordion
    :activeIndex="active"
    class="overflow-hidden rounded-md"
  >
    <AccordionTab
      ref="accordion"
      :header="title"
      :pt="{
        header: { class: 'bg-[var(--surface-ground)] rounded-t-md' },
        headerAction: {
          class:
            'bg-[var(--surface-ground)] rounded-t-md w-full hover:opacity-100 focus:shadow-none'
        },
        content: { class: 'p-4 bg-[var(--surface-section)] rounded-b-md' },
        headerTitle: { class: 'w-full' }
      }"
    >
      <template #header>
        <div class="w-full flex">
          <div class="ml-auto flex justify-center items-center">
            <ProgressSpinner
              v-if="start && !pollEnded"
              class="w-6 h-6 text-color"
              strokeWidth="6"
            />
          </div>
        </div>
      </template>
      <div class="flex flex-col gap-3">
        <div class="flex items-center gap-3">
          <div class="w-1/2">
            <InputText
              v-model="searchTerm"
              placeholder="Search logs..."
              class="w-full"
              size="small"
            />
          </div>
          <div class="w-1/2 flex gap-2 justify-end">
            <Tag
              v-if="errorCount > 0"
              icon="pi pi-times-circle"
              iconPos="right"
              :value="errorCount"
              severity="danger"
              class="cursor-pointer"
              @click="scrollToFirstError"
            />
            <Tag
              v-if="warningCount > 0"
              icon="pi pi-exclamation-triangle"
              iconPos="right"
              :value="warningCount"
              severity="warning"
              class="cursor-pointer"
              @click="scrollToFirstWarning"
            />
            <CopyBlock
              v-if="currentLogs.length > 0"
              :value="logsAsString"
              :is-copy-visible="true"
            />
          </div>
        </div>
        <div
          ref="runner"
          class="bg-transparent flex w-full h-60 flex-col overflow-auto pt-1 pb-3 scrollbar-hide"
        >
          <p
            v-for="(log, index) in filteredLogs"
            :id="log.id"
            :key="log.id || index"
            class="w-full text-xs font-robotomono"
            :class="getLogClass(log)"
          >
            <span> [{{ log.timeStamp }}] </span>
            ›
            <span
              class="w-full"
              v-html="log.content"
            ></span>
          </p>
        </div>
      </div>
    </AccordionTab>
  </Accordion>
</template>

<script setup>
  import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
  import { useToast } from 'primevue/usetoast'
  import Accordion from 'primevue/accordion'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import CopyBlock from '@aziontech/webkit/button-copy'
  import AccordionTab from '@aziontech/webkit/accordion-tab'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import { scriptRunnerService } from '@/services/v2/script-runner'

  defineOptions({ name: 'script-runner-block' })

  const props = defineProps({
    title: {
      type: String,
      required: true
    },
    executionId: {
      type: String,
      required: true
    },
    getLogsService: {
      type: Function,
      default: null
    },
    start: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['onFinish'])

  const toast = useToast()

  const POLL_INTERVAL = 7000
  const STOP_STATUSES = ['succeeded', 'failed', 'pending finish']
  const HIGHLIGHT_DURATION = 2000

  const runner = ref(null)
  const active = ref(null)
  const currentLogs = ref([])
  const status = ref(undefined)
  const pollEnded = ref(false)
  const searchTerm = ref('')

  const isPolling = ref(false)
  const isLogsPolling = ref(false)
  let pollingTimer = null

  const logsService = computed(
    () => props.getLogsService || ((id) => scriptRunnerService.getLogsService(id))
  )

  const filteredLogs = computed(() => {
    if (!searchTerm.value) {
      return currentLogs.value
    }
    const term = searchTerm.value.toLowerCase()
    return currentLogs.value.filter((log) => {
      const content = log.content?.toLowerCase() || ''
      const timestamp = log.timeStamp?.toLowerCase() || ''
      return content.includes(term) || timestamp.includes(term)
    })
  })

  const errorCount = computed(() => currentLogs.value.filter((log) => log.type === 'error').length)

  const warningCount = computed(
    () => currentLogs.value.filter((log) => log.type === 'warning').length
  )

  const logsAsString = computed(() =>
    currentLogs.value.map((log) => `[${log.timeStamp}] › ${log.content}`).join('\n')
  )

  const getLogClass = (log) => {
    if (log.type === 'error') {
      return 'text-red-500'
    }
    if (log.type === 'warning') {
      return 'text-yellow-500'
    }
    return 'text-color'
  }

  const scrollScriptRunnerLogs = () => {
    if (runner.value) {
      runner.value.scrollTo(0, runner.value.scrollHeight)
    }
  }

  const scrollToLog = (logId) => {
    const element = document.getElementById(logId)
    if (!element) {
      return
    }
    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    element.classList.add('highlight-log')
    setTimeout(() => {
      element.classList.remove('highlight-log')
    }, HIGHLIGHT_DURATION)
  }

  const scrollToFirstError = () => {
    const firstError = currentLogs.value.find((log) => log.type === 'error')
    if (firstError?.id) {
      scrollToLog(firstError.id)
    }
  }

  const scrollToFirstWarning = () => {
    const firstWarning = currentLogs.value.find((log) => log.type === 'warning')
    if (firstWarning?.id) {
      scrollToLog(firstWarning.id)
    }
  }

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
  }

  const getLogs = async () => {
    try {
      const data = await logsService.value(props.executionId)
      currentLogs.value = data.logs
      if (currentLogs.value.length > 0) {
        active.value = 0
      }
      status.value = data.status
      if (STOP_STATUSES.includes(status.value)) {
        stopPolling()
        pollEnded.value = true
        emit('onFinish', status.value)
      }
    } catch (error) {
      stopPolling()
      toast.add({
        closable: true,
        severity: 'error',
        summary: error
      })
    }
  }

  const handlePoll = async () => {
    await getLogs()
    isPolling.value = true
    await nextTick()
    if (currentLogs.value.length > 0) {
      scrollScriptRunnerLogs()
    }
  }

  const startPolling = () => {
    pollingTimer = setInterval(async () => {
      if (!isLogsPolling.value && props.executionId) {
        isLogsPolling.value = true
        await handlePoll()
        isLogsPolling.value = false
      }
    }, POLL_INTERVAL)
  }

  watch(
    () => props.start,
    (newVal) => {
      if (newVal && !pollingTimer) {
        startPolling()
      }
    },
    { immediate: true }
  )

  watch(
    () => props.executionId,
    (newVal) => {
      if (newVal && props.start && pollingTimer && !isLogsPolling.value) {
        handlePoll()
      }
    }
  )

  onBeforeUnmount(stopPolling)
</script>

<style scoped>
  .highlight-log {
    background-color: rgba(239, 68, 68, 0.2);
    transition: background-color 0.3s ease;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>
