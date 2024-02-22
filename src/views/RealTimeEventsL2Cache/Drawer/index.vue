<script setup>
  import { ref, watch } from 'vue'
  import Divider from 'primevue/divider'
  import PrimeButton from 'primevue/button'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-l2-cache' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })
  const details = ref({})
  const showDrawer = ref(false)

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    details.value = await props.loadService(item)
  }

  watch(
    () => showDrawer.value,
    (value) => {
      if (!value) {
        details.value = {}
      }
    }
  )

  defineExpose({
    openDetailDrawer
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    title="More Details"
  >
    <template #body>
      <div class="flex flex-col gap-3 md:m-3">
        <InfoSection
          :title="details.proxyHost"
          :date="details.ts"
          :tagText="`Scheme: ${details.scheme} | Server Protocol: ${details.serverProtocol}`"
        >
          <template #body>
            <div class="flex gap-2 items-center w-full">
              <label class="text-sm">Cache Key</label>
              <PrimeButton
                label="Copy"
                icon="pi pi-copy"
                outlined
              />
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Host">{{ details.host }}</TextInfo>
                <TextInfo label="Proxy Host">{{ details.proxyHost }}</TextInfo>
                <TextInfo label="Remote Addr">{{ details.remoteAddr }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Client ID">{{ details.clientId }}</TextInfo>
                <TextInfo label="Solution">{{ details.solution }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Request Data"
          :tagText="`Reference Error`"
          tagSeverity="danger"
        >
          <template #body>
            <div class="flex flex-wrap gap-y-4">
              <BigNumber
                label="Request Time"
                sufix="ms"
              >
                {{ details.requestTime }}
              </BigNumber>
              <BigNumber
                label="TCP Info RTT"
                sufix="ms"
              >
                {{ details.tcpinfoRtt }}
              </BigNumber>
              <BigNumber
                label="Request Length"
                sufix="lines"
              >
                {{ details.requestLength }}
              </BigNumber>
              <BigNumber
                label="Bytes Sent"
                sufix="ms"
              >
                {{ details.bytesSent }}
              </BigNumber>
              <BigNumber
                label="Cache TTL"
                sufix="s"
              >
                {{ details.cacheTtl }}
              </BigNumber>
            </div>
            <Divider />
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Sent HTTP Content Type">{{
                  details.sentHttpContentType
                }}</TextInfo>
                <TextInfo label="Proxy Upstream">{{ details.proxyUpstream }}</TextInfo>
                <TextInfo label="Proxy Status">{{ details.proxyStatus }}</TextInfo>
                <TextInfo label="Status">{{ details.status }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Upstream Data"
          :tagText="`Upstream Cache Status: ${details.upstreamCacheStatus}`"
        >
          <template #body>
            <div class="flex sm:flex-row sm:flex-wrap sm:w-3/4 flex-col gap-y-4 gap-x-8">
              <BigNumber
                label="Upstream Connect Time"
                sufix="ms"
              >
                {{ details.upstreamConnectTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Header Time"
                sufix="ms"
              >
                {{ details.upstreamHeaderTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
              >
                {{ details.upstreamResponseTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Bytes Received"
                sufix="ms"
              >
                {{ details.upstreamBytesReceived }}
              </BigNumber>
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3">
              <TextInfo label="Upstream Addr">{{ details.remoteAddr }}</TextInfo>
              <TextInfo label="Upstream Status">{{ details.upstreamStatus }}</TextInfo>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
