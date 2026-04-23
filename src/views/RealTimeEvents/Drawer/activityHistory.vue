<script setup>
  import { ref, watch, computed } from 'vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import TableEvents from './tableEvents.vue'
  import Skeleton from '@aziontech/webkit/skeleton'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import TabView from 'primevue/tabview'
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'

  defineOptions({ name: 'drawer-events-image-processor' })

  const props = defineProps({
    loadService: {
      type: Function,
      required: true
    }
  })

  const showDrawer = ref(false)
  const loading = ref(false)
  const details = ref({})

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
    const item = details.value.data?.find((obj) => obj.key === key)
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

  const title = computed(() => {
    if (!details.value.title) return 'More Details'
    return `More Details: ${details.value.title}`
  })

  defineExpose({
    openDetailDrawer
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="showDrawer"
    :title="title"
  >
    <template #header-actions>
      <ConsoleFeedback />
    </template>

    <template #body>
      <div class="w-full flex flex-col gap-8 max-md:gap-6">
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
                <div class="flex flex-col sm:flex-row sm:gap-8 gap-3 w-full">
                  <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                    <TextInfo label="Author Name">{{ getValueByKey('authorName') }}</TextInfo>
                    <TextInfo label="Account ID">{{ getValueByKey('accountId') }}</TextInfo>
                    <TextInfo label="User ID">{{ getValueByKey('userId') }}</TextInfo>
                  </div>
                  <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                    <TextInfo label="Author E-mail">{{ getValueByKey('authorEmail') }}</TextInfo>
                    <TextInfo label="Comment">{{ getValueByKey('comment') }}</TextInfo>
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
