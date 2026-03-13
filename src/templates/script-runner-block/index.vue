<template>
  <Accordion :activeIndex="active">
    <AccordionTab
      :header="title"
      ref="accordion"
      :pt="{
        content: { class: 'p-4' },
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
              v-if="errorCount === 0"
              icon="pi pi-times-circle"
              iconPos="right"
              :value="errorCount"
              severity="danger"
            />
            <Tag
              v-if="warningCount === 0"
              icon="pi pi-exclamation-triangle"
              iconPos="right"
              :value="warningCount"
              severity="warning"
            />
            <CopyBlock
              v-if="currentLogs.length === 0"
              :value="logsAsString"
              :is-copy-visible="true"
            />
          </div>
        </div>
        <div
          class="bg-transparent flex w-full h-60 flex-col overflow-auto pt-1 pb-3"
          ref="runner"
        >
          <p
            class="w-full text-color text-base font-robotomono"
            v-for="(log, index) in filteredLogs"
            :key="index"
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
<script>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import ProgressSpinner from 'primevue/progressspinner'
  import InputText from 'primevue/inputtext'
  import Tag from 'primevue/tag'
  import CopyBlock from '@/templates/copy-block/copy-block.vue'
  import { scriptRunnerService } from '@/services/v2/script-runner'

  export default {
    name: 'script-runner-block',
    components: {
      Accordion,
      AccordionTab,
      ProgressSpinner,
      InputText,
      Tag,
      CopyBlock
    },
    data: () => ({
      active: null,
      currentLogs: [],
      polling: null,
      isPolling: false,
      isLogsPolling: false,
      status: undefined,
      emptyLogs: false,
      pollEnded: false,
      searchTerm: ''
    }),
    props: {
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
    },
    watch: {
      start: {
        immediate: true,
        handler(newVal) {
          if (newVal && !this.polling) {
            this.startPolling()
          }
        }
      }
    },
    computed: {
      logsService() {
        return this.getLogsService || ((id) => scriptRunnerService.getLogsService(id))
      },
      disableAccordion() {
        return !this.isPolling || this.currentLogs.length === 0
      },
      filteredLogs() {
        if (!this.searchTerm) {
          return this.currentLogs
        }
        const term = this.searchTerm.toLowerCase()
        return this.currentLogs.filter((log) => {
          const content = log.content?.toLowerCase() || ''
          const timestamp = log.timeStamp?.toLowerCase() || ''
          return content.includes(term) || timestamp.includes(term)
        })
      },
      errorCount() {
        return this.currentLogs.filter((log) => {
          const content = log.content?.toLowerCase() || ''
          return content.includes('error') || content.includes('err')
        }).length
      },
      warningCount() {
        return this.currentLogs.filter((log) => {
          const content = log.content?.toLowerCase() || ''
          return content.includes('warn') || content.includes('warning')
        }).length
      },
      logsAsString() {
        return this.currentLogs.map((log) => `[${log.timeStamp}] › ${log.content}`).join('\n')
      }
    },
    methods: {
      startPolling() {
        this.polling = setInterval(async () => {
          if (!this.isLogsPolling) {
            this.isLogsPolling = true
            await this.handlePoll()
            this.isLogsPolling = false
          }
        }, 7000)
      },
      async getlogs() {
        try {
          const data = await this.logsService(this.executionId)
          const stopStatusList = ['succeeded', 'failed', 'pending finish']
          this.currentLogs = data.logs
          if (this.currentLogs.length > 0) {
            this.active = 0
          }
          this.status = data.status
          if (stopStatusList.includes(this.status)) {
            clearInterval(this.polling)
            this.pollEnded = true
            this.$emit('onFinish', this.status)
          }
        } catch (error) {
          clearInterval(this.polling)
          this.$toast.add({
            closable: true,
            severity: 'error',
            summary: error
          })
        }
      },

      async handlePoll() {
        await this.getlogs()
        this.isPolling = true
        setTimeout(() => {
          if (this.currentLogs.length > 0) {
            this.scrollScriptRunnerLogs()
          }
        }, 100)
      },

      scrollScriptRunnerLogs() {
        const positionY = this.$refs.runner.scrollHeight
        this.$refs.runner.scrollTo(0, positionY)
      }
    },

    beforeUnmount() {
      clearInterval(this.polling)
    }
  }
</script>
