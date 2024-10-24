<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Divider from 'primevue/divider'
  import { computed, ref, watch } from 'vue'
  defineOptions({ name: 'drawer-events-image-processor' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const requestTimeTooltip =
    'Request processing time elapsed since the first bytes were read from the client with resolution in milliseconds. This field is the result of a sum.'
  const tcpInfoRttTooltip =
    'Round-Trip Time (RTT) measured by the edge for the user. Available on systems that support the TCP_INFO socket option.'
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'

  const upstreamResponseTimeTooltip =
    'Time it takes for the edge to receive a default response from the origin in milliseconds, including headers and body. This field is the result of a sum.'
  const upstreamStatusTooltip =
    'HTTP status code of the origin. If a server can’t be selected, the variable keeps the 502 (Bad Gateway) status code.'

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

  const schemeTag = computed(() => {
    if (details.value.scheme) {
      return [{ text: `Scheme: ${details.value.scheme}` }]
    }
    return []
  })

  const upstreamCacheStatusTag = computed(() => {
    if (details.value.upstreamCacheStatus) {
      return [{ text: `Upstream Cache Status: ${details.value.upstreamCacheStatus}` }]
    }
    return []
  })

  const referenceErrorTag = computed(() => {
    return [{ text: `Reference Error`, severity: 'danger' }]
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
          :tags="schemeTag"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col w-full sm:w-5/12 gap-3 flex-1">
                <TextInfo label="HTTP User Agent">{{ details.httpUserAgent }}</TextInfo>
                <TextInfo label="HTTP Referer">{{ details.httpReferer }}</TextInfo>
                <TextInfo label="Solution">{{ details.solution }}</TextInfo>
              </div>
              <div class="flex flex-col w-full sm:w-5/12 gap-3 flex-1">
                <TextInfo label="Remote Addr">{{ details.remoteAddr }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Request Data"
          :tags="referenceErrorTag"
        >
          <template #body>
            <div class="grid grid-cols-2 lg:grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
              <BigNumber
                label="Request Time"
                sufix="ms"
                :tooltipMessage="requestTimeTooltip"
              >
                {{ details.requestTime }}
              </BigNumber>
              <BigNumber
                label="TCP Info RTT"
                sufix=""
                :tooltipMessage="tcpInfoRttTooltip"
              >
                {{ details.tcpinfoRtt }}
              </BigNumber>
              <BigNumber
                label="Bytes Sent"
                sufix="bytes"
                :tooltipMessage="bytesSentTooltip"
              >
                {{ details.bytesSent }}
              </BigNumber>
            </div>
            <Divider />
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col w-full sm:w-5/12 flex-1 gap-3">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="SSL Cipher">{{ details.sslCipher }}</TextInfo>
                <TextInfo label="SSL Protocol">{{ details.sslProtocol }}</TextInfo>
                <TextInfo label="SSL Session Reused">{{ details.sslSessionReused }}</TextInfo>
              </div>
              <div class="flex flex-col w-full sm:w-5/12 flex-1 gap-3">
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request URI">{{ details.requestUri }}</TextInfo>
                <TextInfo label="Status Code">{{ details.status }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Upstream Data"
          :tags="upstreamCacheStatusTag"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row gap-4">
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                :tooltipMessage="upstreamResponseTimeTooltip"
              >
                {{ details.upstreamResponseTime }}
              </BigNumber>
              <TextInfo
                label="Upstream Status"
                :tooltipMessage="upstreamStatusTooltip"
                >{{ details.upstreamStatus }}
              </TextInfo>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
