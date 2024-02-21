<script setup>
  import { ref, watch } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-functions-console' })

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
          :title="`Line Source - ${details.lineSource}`"
          :date="details.ts"
          :tagText="details.level?.content"
          :tagSeverity="details.level?.severity"
          :tagIcon="details.level?.icon"
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
