<script setup>
  import { ref, onMounted } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-functions-console' })

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
      drawerTitle: 'Line Source - Console',
      date: getCurrentDate(),
      line: 'em async mainFetch (ext:deno_fetch/26_fetch.js:266:12)',
      id: 'b204b8c3-e463-4c3d-af3d-025703a4',
      solutionId: '1321',
      configurationId: '112223312',
      functionId: '1111',
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
          :title="details.drawerTitle"
          :date="details.date"
          tagText="Warning"
          tagSeverity="warn"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3">
              <div class="flex flex-col gap-3">
                <TextInfo label="Line">{{ details.line }}</TextInfo>
                <TextInfo label="ID">{{ details.id }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3">
                <TextInfo label="Solution ID">{{ details.solutionId }}</TextInfo>
                <TextInfo label="Function ID">{{ details.functionId }}</TextInfo>
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
                <TextInfo label="Source">{{ details.source }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
