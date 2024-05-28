<script setup>
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Divider from 'primevue/divider'
  import { computed, ref, watch } from 'vue'

  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-http-requests' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const requestTimeTooltip =
    'Request processing time elapsed since the first bytes were read from the client with resolution in milliseconds. This field is the result of a sum.'
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'
  const requestLengthTooltip =
    'Request length in bytes, including request line, headers, and body. This field is the result of a sum.'
  const upstreamBytesReceivedTooltip =
    'Number of bytes received by the origin’s edge if the content isn’t cached. ´Number of bytes received by the origin’s edge if the content isn’t cached.'
  const upstreamResponseTimeTooltip =
    'Time it takes for the edge to receive a default response from the origin in milliseconds, including headers and body.'
  const upstreamBytesSentTooltip = 'Number of bytes sent to the origin.'
  const wafBlockTooltip =
    'Informs whether WAF blocked the action or not. 0 when action wasn’t blocked; 1 when action was blocked. When in Learning Mode, it won’t be blocked regardless of the return.'
  const wafTotalBlockedTooltip = 'Total number of blocked requests.'
  const wafLearningTooltip =
    'Informs if WAF is in Learning mode. Returns 0 if it isn’t and 1 if it’s.'
  const wafTotalProcessedTooltip = 'Total number of processed requests.'

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

  const hostTag = computed(() => {
    const tagHost = []
    if (details.value.scheme) {
      tagHost.push({
        text: `Scheme: ${details.value.scheme}`
      })
    }

    return tagHost
  })

  const secureTag = computed(() => {
    const tagSecure = []
    if (details.value.wafScore) {
      tagSecure.push({
        text: `WAF Score: ${details.value.wafScore}`
      })
    }
    return tagSecure
  })

  const upstreamTag = computed(() => {
    const tagUpstream = []
    if (details.value.upstreamCacheStatus) {
      tagUpstream.push({
        text: `Upstream Cache Status: ${details.value.upstreamCacheStatus}`
      })
    }

    return tagUpstream
  })

  const serverProtocolTag = computed(() => {
    const tagProtocol = []
    if (details.value.serverProtocol) {
      tagProtocol.push({
        text: `Server Protocol: ${details.value.serverProtocol}`
      })
    }

    return tagProtocol
  })

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
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <InfoSection
          :title="details.host"
          :date="details.ts"
          :tags="hostTag"
        >
          <template #body>
            <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Request ID">{{ details.requestId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Remote Address">{{ details.remoteAddress }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Request and Response Data"
          :tags="serverProtocolTag"
        >
          <template #body>
            <div class="grid grid-cols-2 lg:grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
              <BigNumber
                label="Request Time"
                sufix="ms"
                :tooltipMessage="requestTimeTooltip"
                >{{ details.requestTime }}
              </BigNumber>

              <BigNumber
                label="Bytes Sent"
                sufix="ms"
                :tooltipMessage="bytesSentTooltip"
                >{{ details.bytesSent }}
              </BigNumber>

              <BigNumber
                label="Request Length"
                sufix="ms"
                :tooltipMessage="requestLengthTooltip"
                >{{ details.requestLength }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3 sm:gap-8">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Status">{{ details.status }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request URI">{{ details.requestUri }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="HTTP User Agent">{{ details.httpUserAgent }}</TextInfo>

                <TextInfo label="Sent HTTP Content Type">{{
                  details.sentHttpContentType
                }}</TextInfo>
                <TextInfo label="HTTP Referer">{{ details.httpReferer }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Origin Data"
          :tags="upstreamTag"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row gap-8">
              <BigNumber
                label="Upstream Bytes Received"
                sufix="bytes"
                :tooltipMessage="upstreamBytesReceivedTooltip"
                >{{ details.upstreamBytesReceived }}</BigNumber
              >
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                :tooltipMessage="upstreamResponseTimeTooltip"
                >{{ details.upstreamResponseTime }}</BigNumber
              >
              <BigNumber
                label="Upstream Bytes Sent"
                sufix="bytes"
                :tooltipMessage="upstreamBytesSentTooltip"
                >{{ details.upstreamBytesSent }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3">
              <TextInfo
                label="Upstream Addr"
                class="w-full sm:w-5/12 flex-1"
                >{{ details.upstreamAddr }}</TextInfo
              >
              <TextInfo
                label="Upstream Status"
                class="w-full sm:w-5/12 flex-1"
                >{{ details.upstreamStatus }}</TextInfo
              >
            </div>
          </template>
        </InfoSection>

        <InfoSection title="Geolocation Data">
          <template #body>
            <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Geoloc ASN">{{ details.geolocAsn }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Geoloc Country Name">{{ details.geolocCountryName }}</TextInfo>
                <TextInfo label="Geoloc Region Name">{{ details.geolocRegionName }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Secure Data"
          :tags="secureTag"
        >
          <template #body>
            <div class="grid grid-cols-3 w-full gap-4 ml-0 mt-0">
              <BigNumber
                label="WAF Block"
                :tooltipMessage="wafBlockTooltip"
                >{{ details.wafBlock }}</BigNumber
              >
              <BigNumber
                label="WAF Total Blocked"
                :tooltipMessage="wafTotalBlockedTooltip"
                >{{ details.wafTotalBlocked }}
              </BigNumber>
              <BigNumber
                label="WAF Learning"
                :tooltipMessage="wafLearningTooltip"
                >{{ details.wafLearning }}</BigNumber
              >
              <BigNumber
                label="WAF Total Processed"
                :tooltipMessage="wafTotalProcessedTooltip"
                >{{ details.wafTotalProcessed }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full sm:flex-row flex flex-col gap-3 sm:gap-8">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="SSL Cipher">{{ details.sslCipher }}</TextInfo>
                <TextInfo label="SSL Protocol">{{ details.sslProtocol }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="WAF Match">{{ details.wafMatch }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection title="Debug Data">
          <template #body>
            <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Debug Log">{{ details.debugLog }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Stack Trace">{{ details.stacktrace }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
