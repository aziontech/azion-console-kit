<script setup>
  import { ref, onMounted } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
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
      title: 'Q Type - TXT',
      upstreamCacheStatus: 'Revalidated',
      scheme: 'HTTP',
      date: getCurrentDate(),
      qTypeDescription:
        'Description TXT lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque sit amet sodales dolor. Nullam vel finibus lectus. Integer interdum ligula ut rhoncus.',
      zoneId: '1340',
      statusCode: '200',
      resolutionType: 'Standard',
      solutionId: '1321',
      uuid: 'b204b8c3-e463-4c3d-af3d-025703a4',
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
          :title="details.title"
          :date="details.date"
          tagText="Warning"
          tagSeverity="warn"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3">
                <TextInfo label="Q Type Description">{{ details.qTypeDescription }}</TextInfo>
                <TextInfo label="UUID">{{ details.uuid }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Zone ID">{{ details.zoneId }}</TextInfo>
                <TextInfo label="Status Code">{{ details.statusCode }}</TextInfo>
                <TextInfo label="Resolution Type">{{ details.resolutionType }}</TextInfo>
                <TextInfo label="Solution ID">{{ details.solutionId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
