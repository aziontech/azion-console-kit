<script setup>
  import { ref, onMounted } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Divider from 'primevue/divider'
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
      path: 'https://log-receiver.azion.com:9200',
      date: getCurrentDate(),
      configurationId: '1595368520',
      endpointType: 'AZURE_BLOB_STORAGE',
      source: 'edg-fln-ggn001p'
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
          tagText="Data Streaming WAF"
        >
          <template #body>
            <div class="flex gap-4 sm:gap-8 flex-wrap">
              <BigNumber
                label="Streamed Lines"
                sufix="lines"
                >873</BigNumber
              >
              <BigNumber
                label="Data Streamed"
                sufix="bytes"
                >1270</BigNumber
              >
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Endpoint Type">{{ details.endpointType }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
