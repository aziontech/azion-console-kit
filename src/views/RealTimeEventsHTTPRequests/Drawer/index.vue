<script setup>
  import { ref, watch } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-http-requests' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })
  const details = ref({})
  const showDrawer = ref(true)

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
          :title="details.host"
          :date="details.ts"
          :tagText="`Scheme: ${details.scheme}`"
        >
          <template #body>
            <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
              <div class="flex flex-col gap-3">
                <TextInfo
                  class="md:hidden"
                  label="Scheme"
                  >{{ details.scheme }}</TextInfo
                >
                <TextInfo label="HTTP User Agent">{{ details.httpUserAgent }}</TextInfo>
                <TextInfo label="HTTP Referer">{{ details.httpReferer }}</TextInfo>
                <TextInfo label="Virtual Host ID">{{ details.virtualhostId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Remote Address">{{ details.remoteAddress }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection title="Request Data">
          <template #body>
            <div
              class="flex sm:flex-row sm:flex-wrap flex-wrap gap-y-4 gap-x-2 sm:gap-x-4 sm:gap-y-8"
            >
              <BigNumber
                label="Request Time"
                sufix="ms"
                >{{ details.requestTime }}</BigNumber
              >
              <BigNumber
                label="TCP Info RTT"
                sufix="ms"
                >{{ details.tcpinfoRtt }}</BigNumber
              >

              <BigNumber
                label="Request Length"
                sufix="lines"
                >{{ details.requestLength }}</BigNumber
              >

              <BigNumber
                label="Bytes Sent"
                sufix="bytes"
                >{{ details.bytesSent }}</BigNumber
              >
              <BigNumber
                label="Sent HTTP X Original Image Size"
                sufix="bytes"
                >{{ details.sentHttpXOriginalImageSize }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-8">
              <div class="flex flex-col gap-3">
                <TextInfo label="Sent HTTP Content Type">{{
                  details.sentHttpContentType
                }}</TextInfo>
                <TextInfo label="SSL Cipher">{{ details.sslCipher }}</TextInfo>
                <TextInfo label="SSL Server Name">{{ details.sslServerName }}</TextInfo>
                <TextInfo label="SSL Protocol">{{ details.sslProtocol }}</TextInfo>
                <TextInfo label="SSL Session Reused">{{ details.sslSessionReused }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Request ID">{{ details.requestId }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
                <TextInfo label="Proxy Status">{{ details.proxyStatus }}</TextInfo>
                <TextInfo label="Status Code">{{ details.status }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Secure Data"
          :tagText="`WAF Score: ${details.wafScore}`"
        >
          <template #body>
            <div class="flex gap-4">
              <BigNumber label="WAF Total Processed">{{ details.wafTotalProcessed }}</BigNumber>
              <BigNumber label="WAF Total Blocked">{{ details.wafTotalBlocked }}</BigNumber>
            </div>
            <div class="flex gap-4 justify-between">
              <BigNumber label="WAF Block">{{ details.wafBlock }}</BigNumber>
              <BigNumber label="WAF Learning">{{ details.wafLearning }}</BigNumber>
            </div>

            <div class="flex gap-2 items-center w-full">
              <label class="text-sm">WAF EV Headers</label>
              <PrimeButton
                label="Copy"
                icon="pi pi-copy"
                outlined
              />
            </div>

            <Divider />

            <div class="w-full sm:flex-row flex flex-col gap-8">
              <div class="flex flex-col gap-3">
                <TextInfo label="Debug Log">{{ details.debugLog }}</TextInfo>
                <TextInfo label="Session ID">{{ details.sessionid }}</TextInfo>
                <TextInfo label="Stack Trace">{{ details.stackTrace }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="WF Match">{{ details.wafMatch }}</TextInfo>
                <TextInfo label="Geoloc ASN">{{ details.geolocAsn }}</TextInfo>
                <TextInfo label="Geoloc Country Name">{{ details.geolocCountryName }}</TextInfo>
                <TextInfo label="Geoloc Region Name">{{ details.geolocRegionName }}</TextInfo>
                <TextInfo label="Stream Name">{{ details.streamName }}</TextInfo>
                <TextInfo label="Server Addr">{{ details.serverAddr }}</TextInfo>
                <TextInfo label="Server Port">{{ details.serverPort }}</TextInfo>
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
                >{{ details.upstreamConnectTime }}</BigNumber
              >
              <BigNumber
                label="Upstream Bytes Sent"
                sufix="bytes"
                >{{ details.upstreamBytesSent }}</BigNumber
              >
              <BigNumber
                label="Upstream Header Time"
                sufix="ms"
                >{{ details.upstreamHeaderTime }}</BigNumber
              >
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                >{{ details.upstreamResponseTime }}</BigNumber
              >
              <BigNumber
                label="Upstream Bytes Received"
                sufix="bytes"
                >{{ details.upstreamBytesReceived }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3">
              <TextInfo label="Upstream Addr">{{ details.upstreamAddr }}</TextInfo>
              <TextInfo label="Upstream Status">{{ details.upstreamStatus }}</TextInfo>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
