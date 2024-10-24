<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'
  import { useToast } from 'primevue/usetoast'
  import { computed, ref, watch } from 'vue'
  import * as Helpers from '@/helpers'

  defineOptions({ name: 'drawer-events-tiered-cache' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const upstreamConnectTimeTooltip =
    'Time it takes for the edge to establish a connection with the origin in seconds. In the case of TLS, it includes time spent on handshake.'
  const upstreamHeaderTimeTooltip =
    'Time it takes for the edge to receive the response header from the origin in seconds.'
  const upstreamResponseTimeTooltip =
    'Time it takes for the edge to receive a default response from the origin in seconds, including headers and body.'
  const upstreamBytesReceivedTooltip =
    'Number of bytes received by the origin’s edge if the content isn’t cached.'
  const requestTimeTooltip =
    'Request processing time elapsed since the first bytes were read from the client with resolution in seconds. This field is the result of a sum.'
  const tcpInfoRttTooltip =
    'Round-Trip Time (RTT) measured by the edge for the user. Available on systems that support the TCP_INFO socket option.'
  const requestLengthTooltip =
    'Request length, including request line, headers, and body. This field is the result of a sum.'
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'
  const cacheTtlTooltip =
    'Time, in seconds, the cached object is considered valid (not expired). After the time expiration, when a new request occurs, L2 Caching queries the data on the origin (upstream).'

  const details = ref({})
  const showDrawer = ref(false)
  const toast = useToast()

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    details.value = await props.loadService(item)
  }

  const copyCacheKey = () => {
    Helpers.clipboardWrite(details.value.cacheKey)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    })
  }

  watch(
    () => showDrawer.value,
    (value) => {
      if (!value) {
        details.value = {}
      }
    }
  )

  const referenceErrorTag = computed(() => {
    const statusCode = details.value.status

    const isClientError = statusCode >= 400 && statusCode < 500
    const isServerError = statusCode >= 500 && statusCode < 600

    if (isServerError || isClientError) {
      return [{ text: 'Reference Error', severity: 'danger', icon: 'pi pi-times-circle' }]
    }
    return []
  })

  const upstreamCacheStatusTag = computed(() => {
    if (details.value.upstreamCacheStatus) {
      return [{ text: `Upstream Cache Status: ${details.value.upstreamCacheStatus}` }]
    }
    return []
  })

  const proxyTag = computed(() => {
    let tags = []
    if (details.value.scheme) {
      tags.push({ text: `Scheme: ${details.value.scheme}` })
    }
    if (details.value.serverProtocol) {
      tags.push({ text: `Server Protocol: ${details.value.serverProtocol}` })
    }
    return tags
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
          :title="details.proxyHost"
          :date="details.ts"
          :tags="proxyTag"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full items-center">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1 items-center">
                <TextInfo label="Cache Key">
                  <template #default>
                    <p>
                      {{ details.cacheKey }}
                    </p>
                  </template>
                  <template #button>
                    <PrimeButton
                      label="Copy"
                      class="items-center min-w-min"
                      icon="pi pi-copy"
                      @click="copyCacheKey"
                      outlined
                    />
                  </template>
                </TextInfo>
              </div>
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Host">{{ details.host }}</TextInfo>
                <TextInfo label="Proxy Host">{{ details.proxyHost }}</TextInfo>
                <TextInfo label="Remote Addr">{{ details.remoteAddr }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Client ID">{{ details.clientId }}</TextInfo>
                <TextInfo label="Solution">{{ details.solution }}</TextInfo>
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
                sufix="s"
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
                label="Request Length"
                sufix="lines"
                :tooltipMessage="requestLengthTooltip"
              >
                {{ details.requestLength }}
              </BigNumber>
              <BigNumber
                label="Bytes Sent"
                sufix="bytes"
                :tooltipMessage="bytesSentTooltip"
              >
                {{ details.bytesSent }}
              </BigNumber>
              <BigNumber
                label="Cache TTL"
                sufix="s"
                :tooltipMessage="cacheTtlTooltip"
              >
                {{ details.cacheTtl }}
              </BigNumber>
            </div>
            <Divider />
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request URI">{{ details.requestUri }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
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
          :tags="upstreamCacheStatusTag"
        >
          <template #body>
            <div class="grid grid-cols-2 lg:grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
              <BigNumber
                label="Upstream Connect Time"
                sufix="s"
                class="flex-1"
                :tooltipMessage="upstreamConnectTimeTooltip"
              >
                {{ details.upstreamConnectTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Header Time"
                sufix="s"
                class="flex-1"
                :tooltipMessage="upstreamHeaderTimeTooltip"
              >
                {{ details.upstreamHeaderTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Response Time"
                sufix="s"
                class="flex-1"
                :tooltipMessage="upstreamResponseTimeTooltip"
              >
                {{ details.upstreamResponseTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Bytes Received"
                sufix="bytes"
                class="flex-1"
                :tooltipMessage="upstreamBytesReceivedTooltip"
              >
                {{ details.upstreamBytesReceived }}
              </BigNumber>
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3">
              <TextInfo
                class="w-full sm:w-5/12 flex-1"
                label="Upstream Addr"
                >{{ details.remoteAddr }}</TextInfo
              >
              <TextInfo
                class="w-full sm:w-5/12 flex-1"
                label="Upstream Status"
                >{{ details.upstreamStatus }}</TextInfo
              >
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
