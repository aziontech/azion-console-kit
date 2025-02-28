<script setup>
  import InfoDrawerBlock from '@/templates/info-drawer-block'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import TableEvents from './tableEvents.vue'
  import Skeleton from 'primevue/skeleton'

  import { computed, ref, watch } from 'vue'

  defineOptions({ name: 'drawer-events-tiered-cache' })

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

  const proxyTag = computed(() => {
    let tags = []
    if (details.value.scheme) {
      tags.push({ text: `Scheme: ${details.value.scheme}` })
    }
    if (details.value.serverProtocol) {
      tags.push({ text: `Server Protocol: ${details.value.serverProtocol}` })
    }
    return tags
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
          :title="details.proxyHost"
          :date="details.ts"
          :tags="proxyTag"
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
