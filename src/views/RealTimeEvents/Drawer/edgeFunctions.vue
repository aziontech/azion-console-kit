<script setup>
  import { ref, watch, computed } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import Skeleton from 'primevue/skeleton'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import BigNumber from '@/templates/info-drawer-block/info-labels/big-number.vue'

  defineOptions({ name: 'DrawerEventsFunctions' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const details = ref({})
  const showDrawer = ref(false)
  const loading = ref(false)

  const openDetailDrawer = async (item) => {
    showDrawer.value = true
    loading.value = true

    try {
      const response = await props.loadService(item)
      details.value = response
    } finally {
      loading.value = false
    }
  }

  const getValueByKey = (key) => {
    const item = details.value.data.find((obj) => obj.key === key)
    return item ? item.value : '-'
  }

  watch(showDrawer, (isVisible) => {
    if (!isVisible) details.value = {}
  })

  const tags = computed(() => {
    return details.value.functionLanguage
      ? [{ icon: 'pi pi-code', text: details.value.functionLanguage }]
      : []
  })

  defineExpose({ openDetailDrawer })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    title="More Details"
  >
    <template #body>
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
        <InfoSection
          title="Function Language"
          :date="details.ts"
          :tags="tags"
          :loading="loading"
          hideDivider
        />

        <TabView
          class="w-full h-full"
          v-if="!loading"
        >
          <TabPanel header="Table">
            <TableEvents :data="details.data" />
          </TabPanel>
          <TabPanel header="Cards">
            <InfoSection
              class="mt-4"
              hideDivider
            >
              <template #body>
                <div class="gap-8 flex flex-col sm:flex-row w-full">
                  <TextInfo
                    label="Edge Functions List"
                    class="w-full sm:w-5/12 flex-1"
                  >
                    <ul>
                      <li
                        :key="index"
                        v-for="(functionType, index) in getValueByKey('edgeFunctionsList')"
                      >
                        {{ functionType }}
                      </li>
                    </ul>
                  </TextInfo>
                  <BigNumber
                    class="flex-1"
                    label="Edge Functions Time"
                    sufix="s"
                    :tooltipMessage="edgeFunctionsTime"
                    >{{ getValueByKey('edgeFunctionsTime') }}</BigNumber
                  >
                </div>

                <Divider />

                <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                  <div class="flex flex-col gap-3 flex-1">
                    <TextInfo label="Edge Functions Initiator Type List">
                      {{ getValueByKey('edgeFunctionsInitiatorTypeList') }}
                    </TextInfo>
                    <TextInfo label="Edge Functions Instance ID List">
                      {{ getValueByKey('edgeFunctionsInstanceIdList') }}
                    </TextInfo>
                    <TextInfo label="Edge Functions Solution ID">
                      {{ getValueByKey('edgeFunctionsSolutionId') }}
                    </TextInfo>
                  </div>
                  <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                    <TextInfo label="Virtual Host ID">{{
                      getValueByKey('virtualHostId')
                    }}</TextInfo>
                    <TextInfo label="Configuration ID">{{
                      getValueByKey('configurationId')
                    }}</TextInfo>
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
