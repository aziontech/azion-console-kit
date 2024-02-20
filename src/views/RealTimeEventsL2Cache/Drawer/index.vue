<script setup>
  import { ref, onMounted } from 'vue'
  import Divider from 'primevue/divider'
  import PrimeButton from 'primevue/button'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-l2-cache' })

  defineProps({
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
      path: 'storage.googleapis.com:443',
      upstreamCacheStatus: 'Revalidated',
      scheme: 'HTTP',
      date: getCurrentDate(),
      host: 'g1sdetynmxe0ao.map.azionedge.net',
      proxyHost: 'storage.googleapis.com:443',
      remoteAddr: '127.0.0.1',
      remotePort: '8080',
      clientId: '8437r',
      solution: '1321',
      configurationId: '1595368520',
      source: 'edg-fln-ggn001p',
      referenceError: '#AECFE66100000000C947B9B3B3BFBE46FFFFFFFF9401',
      requestMethod: 'GET',
      requestUri: '/v1?v=bo%20dim',
      sentHttpContentType: 'text/html; charset=UTF-8',
      proxyUpstream: 'ims_http',
      proxyStatus: '520',
      status: '401',
      upstreamAddr: '192.168.1.10',
      upstreamStatus: '200'
    }

    return mockValues
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
          :tagText="`Scheme: ${details.scheme} | Server Protocol: HTTP/1.1`"
        >
          <template #body>
            <div class="flex gap-2 items-center w-full">
              <label class="text-sm">Cache Key</label>
              <PrimeButton
                label="Copy"
                icon="pi pi-copy"
                outlined
              />
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Host">{{ details.host }}</TextInfo>
                <TextInfo label="Proxy Host">{{ details.proxyHost }}</TextInfo>
                <TextInfo label="Remote Addr">{{ details.remoteAddr }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Client ID">{{ details.clientId }}</TextInfo>
                <TextInfo label="Solution">{{ details.solution }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Request Data"
          :tagText="`Reference Error`"
          tagSeverity="danger"
        >
          <template #body>
            <div class="flex flex-wrap gap-y-4">
              <BigNumber
                label="Request Time"
                sufix="ms"
                >1.19</BigNumber
              >
              <BigNumber
                label="TCP Info RTT"
                sufix="ms"
                >7219</BigNumber
              >
              <BigNumber
                label="Request Length"
                sufix="lines"
                >167</BigNumber
              >
              <BigNumber
                label="Bytes Sent"
                sufix="ms"
                >191</BigNumber
              >
              <BigNumber
                label="Cache TTL"
                sufix="s"
                >1312319</BigNumber
              >
            </div>
            <Divider />
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Sent HTTP Content Type">{{ details.sentHttpContentType }}</TextInfo>
                <TextInfo label="Proxy Upstream">{{ details.proxyUpstream }}</TextInfo>
                <TextInfo label="Proxy Status">{{ details.proxyStatus }}</TextInfo>
                <TextInfo label="Status">{{ details.status }}</TextInfo>
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
                >031</BigNumber
              >
              <BigNumber
                label="Upstream Header Time"
                sufix="ms"
                >12.3</BigNumber
              >
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                >0.847</BigNumber
              >
              <BigNumber
                label="Upstream Bytes Received"
                sufix="ms"
                >0.847</BigNumber
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
