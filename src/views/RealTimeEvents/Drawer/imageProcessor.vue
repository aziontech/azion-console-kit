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
  defineOptions({ name: 'drawer-events-image-processor' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const details = ref({})
  const showDrawer = ref(false)
  const loading = ref(false)

  const requestTimeTooltip =
    'Request processing time elapsed since the first bytes were read from the client with resolution in seconds. This field is the result of a sum.'
  const tcpInfoRttTooltip =
    'Round-Trip Time (RTT) in microseconds measured by the edge for the user. Available on systems that support the TCP_INFO socket option.'
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'

  const upstreamResponseTimeTooltip =
    'Time it takes for the edge to receive a default response from the origin in seconds, including headers and body. This field is the result of a sum.'
  const upstreamStatusTooltip =
    'HTTP status code of the origin. If a server can’t be selected, the variable keeps the 502 (Bad Gateway) status code.'

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    loading.value = true

    try {
      details.value = await props.loadService(item)
    } finally {
      loading.value = false
    }
  }

  const getValueByKey = (key) => {
    const item = details.value.data.find((obj) => obj.key === key)
    return item ? item.value : '-'
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
                  <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                    <div class="flex flex-col w-full sm:w-5/12 gap-3 flex-1">
                      <TextInfo label="HTTP User Agent">{{
                        getValueByKey('httpUserAgent')
                      }}</TextInfo>
                      <TextInfo label="HTTP Referer">{{ getValueByKey('httpReferer') }}</TextInfo>
                      <TextInfo label="Solution">{{ getValueByKey('solution') }}</TextInfo>
                    </div>
                    <div class="flex flex-col w-full sm:w-5/12 gap-3 flex-1">
                      <TextInfo label="Remote Addr">{{ getValueByKey('remoteAddr') }}</TextInfo>
                      <TextInfo label="Remote Port">{{ getValueByKey('remotePort') }}</TextInfo>
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
                      label="Bytes Sent"
                      sufix="bytes"
                      :tooltipMessage="bytesSentTooltip"
                    >
                      {{ getValueByKey('bytesSent') }}
                    </BigNumber>
                  </div>
                  <Divider />
                  <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                    <div class="flex flex-col w-full sm:w-5/12 flex-1 gap-3">
                      <TextInfo label="Reference Error">{{
                        getValueByKey('referenceError')
                      }}</TextInfo>
                      <TextInfo label="SSL Cipher">{{ getValueByKey('sslCipher') }}</TextInfo>
                      <TextInfo label="SSL Protocol">{{ getValueByKey('sslProtocol') }}</TextInfo>
                      <TextInfo label="SSL Session Reused">{{
                        getValueByKey('sslSessionReused')
                      }}</TextInfo>
                    </div>
                    <div class="flex flex-col w-full sm:w-5/12 flex-1 gap-3">
                      <TextInfo label="Request Method">{{
                        getValueByKey('requestMethod')
                      }}</TextInfo>
                      <TextInfo label="Request URI">{{ getValueByKey('requestUri') }}</TextInfo>
                      <TextInfo label="Status Code">{{ getValueByKey('status') }}</TextInfo>
                    </div>
                  </div>
                </template>
              </InfoSection>

              <InfoSection
                title="Upstream Data"
                :tags="upstreamCacheStatusTag"
              >
                <template #body>
                  <div class="flex flex-col sm:flex-row gap-4 w-full">
                    <BigNumber
                      label="Upstream Response Time"
                      sufix="s"
                      class="w-full"
                      :tooltipMessage="upstreamResponseTimeTooltip"
                    >
                      {{ getValueByKey('upstreamResponseTime') }}
                    </BigNumber>
                    <TextInfo
                      label="Upstream Status"
                      :tooltipMessage="upstreamStatusTooltip"
                      >{{ getValueByKey('upstreamStatus') }}
                    </TextInfo>
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
