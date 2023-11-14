<template>
  <Accordion :activeIndex="active">
    <AccordionTab :header="title" :disabled="!isPolling" ref="accordion">
      <template #header>
        <div class="w-full flex">
          <div class="ml-auto flex justify-center items-center">
            <ProgressSpinner v-if="!pollEnded" class="w-6 h-6" strokeWidth="6"/>
          </div>
        </div>
      </template>
      <div class="bg-transparent flex w-full h-60 flex-col overflow-auto pl-5 pb-3" ref="runner">
        <p class="w-full text-color text-base font-['Menlo']" v-for="(log, index) in this.currentLogs" :key="index">
          <span>
            [{{ log.timeStamp }}]
          </span>
          ›
          <span class="w-full" v-html="log.content"></span>
        </p>
      </div>
    </AccordionTab>
  </Accordion>
</template>
<script>
  import Accordion from 'primevue/accordion';
  import AccordionTab from 'primevue/accordiontab';
  import ProgressSpinner from 'primevue/progressspinner';

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
      pollEnded: false,
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
      scriptRunnerService: {
        type: Function,
        required: true
      }
    },
    methods: {
      startPolling() {
        this.polling = setInterval(() => {
          this.handlePoll();
        }, 3000)
      },
      async getlogs() {
        try {
          const data = await this.scriptRunnerService(this.executionId)
          const stopStatusList = ['succeeded', 'failed', 'pending finish']
          this.currentLogs = data.logs
          this.status = data.status
          if (stopStatusList.includes(this.status)) {
            clearInterval(this.polling);
            this.pollEnded = true
          }
        } catch (error) {
          this.$toast.add({
            closable: false,
            severity: 'error',
            summary: error,
            life: 10000
          })
        }
      },

      async handlePoll() {
        await this.getlogs()
        this.isPolling = true
        this.active = 0
        setTimeout(() => {this.scrollScriptRunnerLogs()}, 100)
      },

      scrollScriptRunnerLogs() {
        const positionY = this.$refs.runner.scrollHeight;
        this.$refs.runner.scrollTo(0, positionY)
      },
    }
  }
</script>
