<script setup>
  import { ref, watch, computed } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Divider from 'primevue/divider'
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

  const tags = computed(() => {
    if (details.value.jobName?.content) {
      return [
        {
          text: details.value.jobName.content,
          severity: details.value.jobName.severity
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
          :title="details.url"
          :date="details.ts"
          :tags="tags"
        >
          <template #body>
            <div class="flex gap-4 sm:gap-8 flex-wrap w-1/2">
              <BigNumber
                label="Streamed Lines"
                sufix="lines"
                class="flex-1"
              >
                {{ details.streamedLines }}
              </BigNumber>
              <BigNumber
                label="Data Streamed"
                sufix="bytes"
                class="flex-1"
              >
                {{ details.dataStreamed }}
              </BigNumber>
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 w-full sm:w-[45%] flex-1">
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-[45%] flex-1">
                <TextInfo label="Endpoint Type">{{ details.endpointType }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
