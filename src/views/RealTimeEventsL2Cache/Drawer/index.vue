<script setup>
  import { ref, watch, computed } from 'vue'
  import Divider from 'primevue/divider'
  import PrimeButton from 'primevue/button'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import { useToast } from 'primevue/usetoast'
  defineOptions({ name: 'drawer-events-l2-cache' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })
  const details = ref({})
  const showDrawer = ref(false)
  const toast = useToast()

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    details.value = await props.loadService(item)
  }

  const copyCacheKey = () => {
    props.clipboardWrite(details.value.cacheKey)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Cache Key copied!'
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
      <div class="w-full flex flex-col gap-8">
        <InfoSection
          :title="details.proxyHost"
          :date="details.ts"
          :tags="proxyTag"
        >
          <template #body>
            <div class="flex w-full gap-3 items-center">
              <span class="w-36 text-color text-sm font-medium">Cache Key</span>
              <span
                class="w-full text-color-secondary break-all text-sm gap-3 flex flex-wrap items-center"
              >
                <label>{{ details.cacheKey }}</label>
                <PrimeButton
                  class="whitespace-nowrap"
                  label="Copy"
                  icon="pi pi-copy"
                  @click="copyCacheKey"
                  outlined
                />
              </span>
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
            <div class="grid grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
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
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
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
            <div
              class="flex sm:flex-row sm:flex-wrap sm:w-1/2 flex-col gap-y-4 gap-x-8 justify-between"
            >
              <BigNumber
                label="Upstream Connect Time"
                sufix="ms"
                class="flex-1"
              >
                {{ details.upstreamConnectTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Header Time"
                sufix="ms"
                class="flex-1"
              >
                {{ details.upstreamHeaderTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                class="flex-1"
              >
                {{ details.upstreamResponseTime }}
              </BigNumber>
              <BigNumber
                label="Upstream Bytes Received"
                sufix="ms"
                class="flex-1"
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
