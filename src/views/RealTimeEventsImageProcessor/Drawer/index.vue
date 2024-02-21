<script setup>
  import { ref, watch } from 'vue'
  import Divider from 'primevue/divider'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-image-processor' })

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
