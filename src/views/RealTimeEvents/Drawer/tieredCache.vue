<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import Skeleton from 'primevue/skeleton'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'

  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'drawer-events-tiered-cache' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const details = ref({})
  const showDrawer = ref(false)
  const loading = ref(false)

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
    'Round-Trip Time (RTT) in microseconds measured by the edge for the user. Available on systems that support the TCP_INFO socket option.'
  const requestLengthTooltip =
    'Request length, including request line, headers, and body. This field is the result of a sum.'
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'
  const cacheTtlTooltip =
    'Time, in seconds, the cached object is considered valid (not expired). After the time expiration, when a new request occurs, L2 Caching queries the data on the origin (upstream).'

  const getValueByKey = (key) => {
    const item = details.value.data.find((obj) => obj.key === key)
    return item ? item.value : '-'
  }

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    loading.value = true

    try {
      details.value = await props.loadService(item)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => showDrawer.value,
    (value) => {
      if (!value) {
        details.value = {}
      }
    }
  )

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
          :loading="loading"
          hideDivider
        />
        <TabView
          class="w-full h-full"
          v-if="!loading"
        >
          <TabPanel header="Table">
            <TableEvents :data="details.data" />
          </TabPanel>
          <TabPanel header="Cards">
            <div class="w-full flex flex-col gap-8 max-md:gap-6 mt-4">
              <InfoSection hideDivider>
                <template #body>
                  <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full items-center">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1 items-center">
                      <TextInfo label="Cache Key">
                        <template #default>
                          <p>
                            {{ getValueByKey('cacheKey') }}
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
                      <TextInfo label="Host">{{ getValueByKey('host') }}</TextInfo>
                      <TextInfo label="Proxy Host">{{ getValueByKey('proxyHost') }}</TextInfo>
                      <TextInfo label="Remote Addr">{{ getValueByKey('remoteAddr') }}</TextInfo>
                      <TextInfo label="Remote Port">{{ getValueByKey('remotePort') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Client ID">{{ getValueByKey('clientId') }}</TextInfo>
                      <TextInfo label="Solution">{{ getValueByKey('solution') }}</TextInfo>
                      <TextInfo label="Configuration ID">{{
                        getValueByKey('configurationId')
                      }}</TextInfo>
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
                      {{ getValueByKey('requestTime') }}
                    </BigNumber>
                    <BigNumber
                      label="TCP Info RTT"
                      sufix="µs"
                      :tooltipMessage="tcpInfoRttTooltip"
                    >
                      {{ getValueByKey('tcpinfoRtt') }}
                    </BigNumber>
                    <BigNumber
                      label="Request Length"
                      sufix="lines"
                      :tooltipMessage="requestLengthTooltip"
                    >
                      {{ getValueByKey('requestLength') }}
                    </BigNumber>
                    <BigNumber
                      label="Bytes Sent"
                      sufix="bytes"
                      :tooltipMessage="bytesSentTooltip"
                    >
                      {{ getValueByKey('bytesSent') }}
                    </BigNumber>
                    <BigNumber
                      label="Cache TTL"
                      sufix="s"
                      :tooltipMessage="cacheTtlTooltip"
                    >
                      {{ getValueByKey('cacheTtl') }}
                    </BigNumber>
                  </div>
                  <Divider />
                  <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Reference Error">{{
                        getValueByKey('referenceError')
                      }}</TextInfo>
                      <TextInfo label="Request Method">{{
                        getValueByKey('requestMethod')
                      }}</TextInfo>
                      <TextInfo label="Request URI">{{ getValueByKey('requestUri') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Sent HTTP Content Type">{{
                        getValueByKey('sentHttpContentType')
                      }}</TextInfo>
                      <TextInfo label="Proxy Upstream">{{
                        getValueByKey('proxyUpstream')
                      }}</TextInfo>
                      <TextInfo label="Proxy Status">{{ getValueByKey('proxyStatus') }}</TextInfo>
                      <TextInfo label="Status">{{ getValueByKey('status') }}</TextInfo>
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
                      {{ getValueByKey('upstreamConnectTime') }}
                    </BigNumber>
                    <BigNumber
                      label="Upstream Header Time"
                      sufix="s"
                      class="flex-1"
                      :tooltipMessage="upstreamHeaderTimeTooltip"
                    >
                      {{ getValueByKey('upstreamHeaderTime') }}
                    </BigNumber>
                    <BigNumber
                      label="Upstream Response Time"
                      sufix="s"
                      class="flex-1"
                      :tooltipMessage="upstreamResponseTimeTooltip"
                    >
                      {{ getValueByKey('upstreamResponseTime') }}
                    </BigNumber>
                    <BigNumber
                      label="Upstream Bytes Received"
                      sufix="bytes"
                      class="flex-1"
                      :tooltipMessage="upstreamBytesReceivedTooltip"
                    >
                      {{ getValueByKey('upstreamBytesReceived') }}
                    </BigNumber>
                  </div>

                  <Divider />

                  <div class="w-full flex sm:flex-row flex-col gap-3">
                    <TextInfo
                      class="w-full sm:w-5/12 flex-1"
                      label="Upstream Addr"
                      >{{ getValueByKey('remoteAddr') }}</TextInfo
                    >
                    <TextInfo
                      class="w-full sm:w-5/12 flex-1"
                      label="Upstream Status"
                      >{{ getValueByKey('upstreamStatus') }}</TextInfo
                    >
                  </div>
                </template>
              </InfoSection>
            </div>
          </TabPanel>
        </TabView>
        <div
          class="flex flex-col gap-3 w-full flex-1 border rounded-md surface-border p-4"
          v-else
        >
          <Skeleton
            class="w-full h-5 mt-7"
            v-for="skeletonItem in 10"
            :key="skeletonItem"
          />
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
