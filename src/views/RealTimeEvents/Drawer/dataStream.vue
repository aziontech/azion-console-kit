<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import Skeleton from 'primevue/skeleton'
  import TableEvents from './tableEvents.vue'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'

  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'drawer-events-image-processor' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const details = ref({})
  const showDrawer = ref(false)
  const loading = ref(false)
  const streamedLinesTooltip =
    'Total amount of lines streamed to the configured endpoint. Maximum value of 2000. This field is the result of a sum.'
  const dataStreamedTooltip =
    'Total amount of data streamed, in bytes, to the configured endpoint. This field is the result of a sum.'

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    loading.value = true

    try {
      details.value = await props.loadService(item)
    } finally {
      loading.value = false
    }
  }

  const getValueByKey = (key) => {
    const item = details.value.data.find((obj) => obj.key === key)
    return item ? item.value : '-'
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
          :loading="loading"
        />

        <TabView
          class="w-full h-full"
          v-if="!loading"
        >
          <TabPanel header="Table">
            <TableEvents :data="details.data" />
          </TabPanel>
          <TabPanel header="Cards">
            <InfoSection class="mt-4">
              <template #body>
                <div class="grid grid-cols-2 lg:grid-cols-3 w-full ml-[1px] gap-4 lg:gap-8">
                  <BigNumber
                    label="Streamed Lines"
                    sufix="lines"
                    class="flex-1"
                    :tooltipMessage="streamedLinesTooltip"
                  >
                    {{ getValueByKey('streamedLines') }}
                  </BigNumber>
                  <BigNumber
                    label="Data Streamed"
                    sufix="bytes"
                    class="flex-1"
                    :tooltipMessage="dataStreamedTooltip"
                  >
                    {{ getValueByKey('dataStreamed') }}
                  </BigNumber>
                </div>

                <Divider />

                <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                  <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                    <TextInfo label="Configuration ID">{{
                      getValueByKey('configurationId')
                    }}</TextInfo>
                    <TextInfo label="Status Code">{{ getValueByKey('statusCode') }}</TextInfo>
                  </div>
                  <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                    <TextInfo label="Endpoint Type">{{ getValueByKey('endpointType') }}</TextInfo>
                  </div>
                </div>
              </template>
            </InfoSection>
          </TabPanel>
        </TabView>
        <div
          class="flex flex-col gap-3 w-full flex-1 border rounded-md surface-border p-4"
          v-else
        >
          <Skeleton
            class="w-full h-5 mt-7"
            v-for="skeletonItem in 10"
            :key="skeletonItem"
          />
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
