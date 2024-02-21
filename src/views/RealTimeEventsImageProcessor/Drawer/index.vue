<script setup>
  import { ref, onMounted } from 'vue'
  import Divider from 'primevue/divider'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-image-processor' })

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
      path: 'http://example.com.br',
      upstreamCacheStatus: 'Revalidated',
      scheme: 'HTTP',
      date: getCurrentDate(),
      httpUserAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      remoteAddr: '127.0.0.1',
      remotePort: '8080',
      host: 'g1sdetynmxe0ao.map.azionedge.net',
      remoteAddressClass: '44.192.0.0/11',
      solution: '1321',
      configurationId: '1595368520',
      source: 'edg-fln-ggn001p',
      referenceError: '#AECFE66100000000C947B9B3B3BFBE46FFFFFFFF9401',
      requestMethod: 'GET',
      requestUri: '/v1?v=bo%20dim',
      sslCipher: 'TLS_AES_256_GCM_SHA384',
      statusCode: '401',
      sslProtocol: 'TLS v1.2',
      sslSessionReused: 'r',
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
          :tagText="`Scheme: ${details.scheme}`"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="HTTP User Agent">{{ details.httpUserAgent }}</TextInfo>
                <TextInfo label="Host">{{ details.host }}</TextInfo>
                <TextInfo label="Solution">{{ details.solution }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Remote Addr">{{ details.remoteAddr }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
                <TextInfo label="Remote Address Class">{{ details.remoteAddressClass }}</TextInfo>
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
            <div class="flex flex-wrap gap-y-4 ">
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
                label="Bytes Sent"
                sufix="ms"
                >191</BigNumber
              >
            </div>
            <Divider />
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Reference Error">{{ details.referenceError }}</TextInfo>
                <TextInfo label="SSL Cipher">{{ details.sslCipher }}</TextInfo>
                <TextInfo label="SSL Protocol">{{ details.sslProtocol }}</TextInfo>
                <TextInfo label="SSL Session Reused">{{ details.sslSessionReused }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Request Method">{{ details.requestMethod }}</TextInfo>
                <TextInfo label="Request Uri">{{ details.requestUri }}</TextInfo>
                <TextInfo label="Status Code">{{ details.statusCode }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <InfoSection
          title="Upstream Data"
          :tagText="`Upstream Cache Status: ${details.upstreamCacheStatus}`"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row gap-4">
              <BigNumber
                label="Upstream Response Time"
                sufix="ms"
                >0.847</BigNumber
              >
              <TextInfo label="Upstream Status">{{ details.upstreamStatus }}</TextInfo>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
