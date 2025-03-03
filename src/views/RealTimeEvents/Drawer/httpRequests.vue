<script setup>
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import { computed, ref, watch } from 'vue'
  import Skeleton from 'primevue/skeleton'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'

  import InfoDrawerBlock from '@/templates/info-drawer-block'
  defineOptions({ name: 'drawer-events-http-requests' })

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
    try {
      loading.value = true
      details.value = await props.loadService(item)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => showDrawer.value,
    (value) => {
      if (!value) {
        details.value = {}
      }
    }
  )

  const hostTag = computed(() => {
    const tagHost = []
    if (details.value.scheme) {
      tagHost.push({
        text: `Scheme: ${details.value.scheme}`
      })
    }

    return tagHost
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
          :title="details.host"
          :date="details.ts"
          :tags="hostTag"
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
            <h4>Cards</h4>
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
