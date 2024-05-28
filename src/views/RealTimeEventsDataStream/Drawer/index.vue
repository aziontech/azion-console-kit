<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Divider from 'primevue/divider'
  import { computed, ref, watch } from 'vue'
  defineOptions({ name: 'drawer-events-image-processor' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })
  const streamedLinesTooltip =
    'Total amount of lines streamed to the configured endpoint. Maximum value of 2000. This field is the result of a sum.'
  const dataStreamedTooltip =
    'Total amount of data streamed, in bytes, to the configured endpoint. This field is the result of a sum.'

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
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <InfoSection
          :title="details.url"
          :date="details.ts"
          :tags="tags"
        >
          <template #body>
            <div class="grid grid-cols-2 lg:grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
              <BigNumber
                label="Streamed Lines"
                sufix="lines"
                class="flex-1"
                :tooltipMessage="streamedLinesTooltip"
              >
                {{ details.streamedLines }}
              </BigNumber>
              <BigNumber
                label="Data Streamed"
                sufix="bytes"
                class="flex-1"
                :tooltipMessage="dataStreamedTooltip"
              >
                {{ details.dataStreamed }}
              </BigNumber>
            </div>

            <Divider />

            <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Configuration ID">{{ details.configurationId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Endpoint Type">{{ details.endpointType }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
