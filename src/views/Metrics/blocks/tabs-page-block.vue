<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import Dropdown from 'primevue/dropdown'
  import Skeleton from 'primevue/skeleton'
  import TabMenu from 'primevue/tabmenu'
  import { computed } from 'vue'

  const metricsStore = useMetricsStore()
  const { getGroupPages, groupPageCurrent, getPages, pageCurrent } = storeToRefs(metricsStore)
  const { setCurrentGroupPageByLabels, resetFilters, setCurrentPage } = metricsStore

  const metricsGroups = computed(() => {
    return getGroupPages.value
  })

  const selectedGroup = computed(() => {
    return groupPageCurrent.value
  })

  const changeGroup = (evt) => {
    resetFilters()
    setCurrentGroupPageByLabels(evt.value.label)
  }

  const groupPages = computed(() => {
    return getPages.value
  })

  const selectedPage = computed(() => {
    return groupPages.value?.findIndex((dashboard) => dashboard.id === pageCurrent.value?.id)
  })

  const changePage = (evt) => {
    const selectedPage = groupPages.value[evt.index]
    setCurrentPage(selectedPage)
  }
</script>
<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown
      :modelValue="selectedGroup"
      :options="metricsGroups"
      :loading="!metricsGroups.length"
      optionLabel="label"
      class="flex self-start"
      @change="changeGroup"
    />
    <Skeleton
      class="w-96 h-8"
      v-if="!groupPages?.length"
    />
    <TabMenu
      v-else
      :activeIndex="selectedPage"
      :model="groupPages"
      :key="selectedPage"
      :pt="{ action: { class: 'w-max' } }"
      @tab-change="changePage"
    />
  </div>
</template>
