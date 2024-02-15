<script setup>
  import { ref, onMounted } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'

  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-http-requests' })

  const props = defineProps({
    loadDetails: Function
  })

  const getCurrentDate = () => {
    const date = new Date()
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }
    return date.toLocaleString('en-US', options)
  }

  const showDrawer = ref(true)

  const loadMockedDetails = () => {
    const mockValues = {
      path: 'http://example.com.br',
      date: getCurrentDate(),
      wafScore: 'Traversal',
      scheme: 'HTTP',
      upstreamCacheStatus: 'Revalidated',
      httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      host: 'g1sdetynmxe0ao.map.azionedge.net',
      virtualHostId: '2410001a',
      remoteAddress: '127.0.0.1',
      remotePort: '8080',
      configurationId: '1595368520',
      source: 'edg-fln-ggn001p',
      requestTime: '1.19',
      requestLength: '72052',
      tcpInfoRtt: '72052',
      bytesSent: '199',
      sentHttpXOriginalImageSize: '987390',
      sentHttpContentType: 'text/html; charset=UTF-8',
      sslCipher: 'TLS_AES_256_GCM_SHA384',
      sslServerName: 'a-static.mlcdn.com.br',
      sslProtocol: 'TLS v1.2',
      sslSessionReused: 'r',
      requestId: '5f222ae5938482c32a822dbf15e19f0f',
      requestMethod: 'GET',
      requestUri: '/v1?v=bo%20dim',
      proxyStatus: '520',
      statusCode: '200',
      wafTotalProcessed: '5',
      wafTotalBlocked: '3',
      wafBlock: '0',
      wafLearning: '4',
      debugLog: '{"edge_firewall":["Global - Set WAF"]}',
      sessionId: 'f41eabd4-c172-43e4-ac21-d9f5fc427128',
      stackTrace:
        '{"edge_application_request":["Default Rule","Set Cache - Manifest m3u8"],"edge_application_response":["CORs","Version","Filter Http","Remove Header Server"]}',
      wfMatch: '0:1402:HEADERS:cookie',
      geolocAsn: 'AS52580 Azion Technologies Ltda.',
      geolocCountryName: 'United States',
      geolocRegionName: 'California',
      streamName: 'gaucha_rbs.sdp',
      serverAddr: '192.158.1.38',
      serverPort: '443',
      upstreamConnectTime: '0.123',
      upstreamBytesSent: '1234',
      upstreamHeaderTime: '0.444',
      upstreamResponseTime: '0.321',
      upstreamBytesReceived: '2374',
      upstreamAddr: '192.168.1.10',
      upstreamStatus: '200'
    }

    return mockValues
  }

  const toggleDrawer = (isOpen) => {
    showDrawer.value = isOpen
  }

  const details = ref({})
  onMounted(() => {
    details.value = loadMockedDetails()
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
          :title="details.path"
          :date="details.date"
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
                <TextInfo label="Host">{{ details.host }}</TextInfo>
                <TextInfo label="Virtual Host ID">{{ details.virtualHostId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Remote Address">{{ details.remoteAddress }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection title="Request Data">
          <template #body>
            <div class="flex sm:flex-row sm:flex-wrap sm:w-3/4 flex-wrap gap-y-4 gap-x-2">
              <BigNumber
                label="Request Time"
                sufix="ms"
                >{{ details.requestTime }}</BigNumber
              >
              <BigNumber
                label="TCP Info RTT"
                sufix="ms"
                >{{ details.tcpInfoRtt }}</BigNumber
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
                <TextInfo label="Status Code">{{ details.statusCode }}</TextInfo>
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
                <TextInfo label="Session ID">{{ details.sessionId }}</TextInfo>
                <TextInfo label="Stack Trace">{{ details.stackTrace }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="WF Match">{{ details.wfMatch }}</TextInfo>
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
