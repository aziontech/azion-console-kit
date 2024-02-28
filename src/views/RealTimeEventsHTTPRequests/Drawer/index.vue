<script setup>
  import { ref, watch, computed } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
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
    if (details.value.scheme) {
      return [
        {
          text: `Scheme: ${details.value.scheme}`
        }
      ]
    }
    return []
  })

  const secureTag = computed(() => {
    if (details.value.wafScore !== undefined) {
      return [
        {
          text: `WAF Score: ${details.value.wafScore}`
        }
      ]
    }
    return []
  })

  const upstreamTag = computed(() => {
    if (details.value.upstreamCacheStatus) {
      return [
        {
          text: `Upstream Cache Status: ${details.value.upstreamCacheStatus}`
        }
      ]
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
      <div class="flex flex-col gap-6 sm:gap-8 md:m-3">
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

        <InfoSection title="Request and Response Data">
          <template #body>
            <div class="flex flex-wrap gap-4 sm:gap-8">
              <BigNumber
                label="Request Time"
                sufix="ms"
                >{{ details.requestTime }}</BigNumber
              >

              <BigNumber
                label="Bytes Sent"
                sufix="bytes"
                >{{ details.bytesSent }}</BigNumber
              >
              <BigNumber
                label="Request Length"
                sufix="lines"
                >{{ details.requestLength }}</BigNumber
              >
            </div>

            <Divider />

            <div class="w-full flex sm:flex-row flex-col gap-3 sm:gap-8">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Status">{{ details.status }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
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
                >{{ details.upstreamBytesReceived }}</BigNumber
              >
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                >{{ details.upstreamResponseTime }}</BigNumber
              >
              <BigNumber
                label="Upstream Bytes Sent"
                sufix="bytes"
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

        <InfoSection title="Geo-location Data">
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
              <BigNumber label="WAF Block">{{ details.wafBlock }}</BigNumber>
              <BigNumber label="WAF Total Blocked">{{ details.wafTotalBlocked }}</BigNumber>
              <BigNumber label="WAF Learning">{{ details.wafLearning }}</BigNumber>
              <BigNumber label="WAF Total Processed">{{ details.wafTotalProcessed }}</BigNumber>
            </div>

            <Divider />

            <div class="w-full sm:flex-row flex flex-col gap-3 sm:gap-8">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="SSL Cipher">{{ details.sslCipher }}</TextInfo>
                <TextInfo label="SSL Protocol">{{ details.sslProtocol }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="WF Match">{{ details.wafMatch }}</TextInfo>
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
                <TextInfo label="Stack Trace">{{ details.stackTrace }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
