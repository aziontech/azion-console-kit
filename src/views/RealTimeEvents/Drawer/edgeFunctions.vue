<script setup>
  import { ref, watch, computed } from 'vue'

  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import Skeleton from 'primevue/skeleton'
  import InfoDrawerBlock from '@/templates/info-drawer-block'

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
        />

        <TableEvents
          v-if="!loading"
          :data="details.data"
        />

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
