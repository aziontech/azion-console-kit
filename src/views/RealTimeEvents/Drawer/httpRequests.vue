<script setup>
  import TextInfo from '@/templates/info-drawer-block/info-labels/text-info.vue'
  import InfoSection from '@/templates/info-drawer-block/info-section'
  import tableEvents from './tableEvents.vue'
  import { computed, ref, watch } from 'vue'
  import Skeleton from 'primevue/skeleton'

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
          v-if="!loading"
        >
          <template #body>
            <div class="w-full flex flex-col md:flex-row md:gap-8 gap-3">
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Request ID">{{ details.requestId }}</TextInfo>
              </div>
              <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
                <TextInfo label="Remote Address">{{ details.remoteAddress }}</TextInfo>
                <TextInfo label="Remote Port">{{ details.remotePort }}</TextInfo>
              </div>
            </div>
          </template>
        </InfoSection>

        <div
          v-else
          class="w-full flex flex-col md:flex-row md:gap-8 gap-3"
        >
          <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
            <Skeleton class="w-full h-12 mt-7" />
          </div>
          <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
            <Skeleton class="w-full h-12 mt-7" />
            <Skeleton class="w-full h-12 mt-7" />
          </div>
        </div>

        <tableEvents
          v-if="!loading"
          :data="details.data"
        ></tableEvents>

        <div
          v-else
          class="w-full flex"
        >
          <div class="flex flex-col gap-3 w-full sm:w-5/12 flex-1">
            <Skeleton
              class="w-full h-12 mt-7"
              v-for="skeletonItem in 10"
              :key="skeletonItem"
            />
          </div>
        </div>
      </div>
    </template>
  </InfoDrawerBlock>
</template>
