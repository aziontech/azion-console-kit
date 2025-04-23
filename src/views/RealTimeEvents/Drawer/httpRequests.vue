<script setup>
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import { computed, ref, watch } from 'vue'
  import Skeleton from 'primevue/skeleton'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'

  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-http-requests' })

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
  const bytesSentTooltip = 'Number of bytes sent to a client. This field is the result of a sum.'
  const requestLengthTooltip =
    'Request length in bytes, including request line, headers, and body. This field is the result of a sum.'
  const upstreamBytesReceivedTooltip =
    'Number of bytes received by the origin’s edge if the content isn’t cached. ´Number of bytes received by the origin’s edge if the content isn’t cached.'
  const upstreamResponseTimeTooltip =
    'Time it takes for the edge to receive a default response from the origin in seconds, including headers and body.'
  const upstreamBytesSentTooltip = 'Number of bytes sent to the origin.'
  const wafBlockTooltip =
    'Informs whether WAF blocked the action or not. 0 when action wasn’t blocked; 1 when action was blocked. When in Learning Mode, it won’t be blocked regardless of the return.'
  const wafTotalBlockedTooltip = 'Total number of blocked requests.'
  const wafLearningTooltip =
    'Informs if WAF is in Learning mode. Returns 0 if it isn’t and 1 if it’s.'
  const wafTotalProcessedTooltip = 'Total number of processed requests.'

  const getValueByKey = (key) => {
    const item = details.value.data.find((obj) => obj.key === key)
    return item ? item.value : '-'
  }

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    try {
      loading.value = true
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

  const hostTag = computed(() => {
    const tagHost = []
    if (details.value.scheme) {
      tagHost.push({
        text: `Scheme: ${details.value.scheme}`
      })
    }

    return tagHost
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
            <div class="w-full flex flex-col gap-8 max-md:gap-6">
              <InfoSection
                class="mt-4"
                hideDivider
              >
                <template #body>
                  <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Request ID">{{ getValueByKey('requestId') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Remote Address">{{
                        getValueByKey('remoteAddress')
                      }}</TextInfo>
                      <TextInfo label="Remote Port">{{ getValueByKey('remotePort') }}</TextInfo>
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
                      sufix="s"
                      :tooltipMessage="requestTimeTooltip"
                    >
                      {{ getValueByKey('requestTime') }}
                    </BigNumber>

                    <BigNumber
                      label="Bytes Sent"
                      sufix="bytes"
                      :tooltipMessage="bytesSentTooltip"
                    >
                      {{ getValueByKey('bytesSent') }}
                    </BigNumber>

                    <BigNumber
                      label="Request Length"
                      sufix="bytes"
                      :tooltipMessage="requestLengthTooltip"
                    >
                      {{ getValueByKey('requestLength') }}
                    </BigNumber>
                  </div>

                  <Divider />

                  <div class="w-full flex sm:flex-row flex-col gap-3 sm:gap-8">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Status">{{ getValueByKey('status') }}</TextInfo>
                      <TextInfo label="Request Method">{{
                        getValueByKey('requestMethod')
                      }}</TextInfo>
                      <TextInfo label="Request URI">{{ getValueByKey('requestUri') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="HTTP User Agent">{{
                        getValueByKey('httpUserAgent')
                      }}</TextInfo>

                      <TextInfo label="Sent HTTP Content Type">{{
                        getValueByKey('sentHttpContentType')
                      }}</TextInfo>
                      <TextInfo label="HTTP Referer">{{ getValueByKey('httpReferer') }}</TextInfo>
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
                      >{{ getValueByKey('upstreamBytesReceived') }}</BigNumber
                    >
                    <BigNumber
                      label="Upstream Response Time"
                      sufix="s"
                      :tooltipMessage="upstreamResponseTimeTooltip"
                      >{{ getValueByKey('upstreamResponseTime') }}</BigNumber
                    >
                    <BigNumber
                      label="Upstream Bytes Sent"
                      sufix="bytes"
                      :tooltipMessage="upstreamBytesSentTooltip"
                      >{{ getValueByKey('upstreamBytesSent') }}</BigNumber
                    >
                  </div>

                  <Divider />

                  <div class="w-full flex sm:flex-row flex-col gap-3">
                    <TextInfo
                      label="Upstream Addr"
                      class="w-full sm:w-5/12 flex-1"
                      >{{ getValueByKey('upstreamAddr') }}</TextInfo
                    >
                    <TextInfo
                      label="Upstream Status"
                      class="w-full sm:w-5/12 flex-1"
                      >{{ getValueByKey('upstreamStatus') }}</TextInfo
                    >
                  </div>
                </template>
              </InfoSection>

              <InfoSection title="Geolocation Data">
                <template #body>
                  <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Geoloc ASN">{{ getValueByKey('geolocAsn') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Geoloc Country Name">{{
                        getValueByKey('geolocCountryName')
                      }}</TextInfo>
                      <TextInfo label="Geoloc Region Name">{{
                        getValueByKey('geolocRegionName')
                      }}</TextInfo>
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
                      >{{ getValueByKey('wafBlock') }}</BigNumber
                    >
                    <BigNumber
                      label="WAF Total Blocked"
                      :tooltipMessage="wafTotalBlockedTooltip"
                      >{{ getValueByKey('wafTotalBlocked') }}
                    </BigNumber>
                    <BigNumber
                      label="WAF Learning"
                      :tooltipMessage="wafLearningTooltip"
                      >{{ getValueByKey('wafLearning') }}</BigNumber
                    >
                    <BigNumber
                      label="WAF Total Processed"
                      :tooltipMessage="wafTotalProcessedTooltip"
                      >{{ getValueByKey('wafTotalProcessed') }}</BigNumber
                    >
                  </div>

                  <Divider />

                  <div class="w-full sm:flex-row flex flex-col gap-3 sm:gap-8">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="SSL Cipher">{{ getValueByKey('sslCipher') }}</TextInfo>
                      <TextInfo label="SSL Protocol">{{ getValueByKey('sslProtocol') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="WAF Match">{{ getValueByKey('wafMatch') }}</TextInfo>
                    </div>
                  </div>
                </template>
              </InfoSection>

              <InfoSection title="Debug Data">
                <template #body>
                  <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Debug Log">{{ getValueByKey('debugLog') }}</TextInfo>
                    </div>
                    <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                      <TextInfo label="Stack Trace">{{ getValueByKey('stacktrace') }}</TextInfo>
                    </div>
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
