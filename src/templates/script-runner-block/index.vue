<template>
  <Accordion :activeIndex="active">
    <AccordionTab
      :header="title"
      :disabled="disableAccordion"
      ref="accordion"
      :pt="{
        content: { class: 'p-0 pl-5' },
        headerTitle: { class: 'w-full' }
      }"
    >
      <template #header>
        <div class="w-full flex">
          <div class="ml-auto flex justify-center items-center">
            <ProgressSpinner
              v-if="!pollEnded"
              class="w-6 h-6 text-color"
              strokeWidth="6"
            />
          </div>
        </div>
      </template>
      <div
        class="bg-transparent flex w-full h-60 flex-col overflow-auto pt-1 pb-3"
        ref="runner"
      >
        <p
          class="w-full text-color text-base font-robotomono"
          v-for="(log, index) in this.currentLogs"
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
    </AccordionTab>
  </Accordion>
</template>
<script>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import ProgressSpinner from 'primevue/progressspinner'

  export default {
    name: 'script-runner-block',
    components: {
      Accordion,
      AccordionTab,
      ProgressSpinner
    },
    async created() {
      await this.startPolling()
    },
    data: () => ({
      active: null,
      currentLogs: [],
      polling: null,
      isPolling: false,
      status: undefined,
      emptyLogs: false,
      pollEnded: false
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
        required: true
      }
    },
    computed: {
      disableAccordion() {
        return !this.isPolling || this.currentLogs.length === 0
      }
    },
    methods: {
      startPolling() {
        this.polling = setInterval(() => {
          this.handlePoll()
        }, 3000)
      },
      async getlogs() {
        try {
          const data = await this.getLogsService(this.executionId)
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
