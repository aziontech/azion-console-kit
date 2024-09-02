<script setup>
  import { ref, watch, computed } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
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

  const tags = computed(() => {
    if (details.value.level) {
      return [
        {
          text: details.value.level.content,
          severity: details.value.level.severity,
          icon: details.value.level.icon
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
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <InfoSection
          :title="`Q Type - ${details.qtype}`"
          :date="details.ts"
          :tags="tags"
        >
          <template #body>
            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="UUID">{{ details.uuid }}</TextInfo>
                <TextInfo label="Q Type Description">{{ details.qTypeDescription }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Zone ID">{{ details.zoneId }}</TextInfo>
                <TextInfo label="Status Code">{{ details.statusCode }}</TextInfo>
                <TextInfo label="Resolution Type">{{ details.resolutionType }}</TextInfo>
                <TextInfo label="Solution ID">{{ details.solutionId }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
