<script setup>
  import { useMetricsStore } from '@/stores/metrics'
  import { storeToRefs } from 'pinia'
  import Dropdown from 'primevue/dropdown'
  import Skeleton from 'primevue/skeleton'
  import TabMenu from 'primevue/tabmenu'
  import { computed } from 'vue'

  const metricsStore = useMetricsStore()
  const { getGroupPages, groupPageCurrent, getPages, pageCurrent } = storeToRefs(metricsStore)
  const {
    setCurrentGroupPageByLabels,
    resetFilters,
    setCurrentPage,
    setDatasetAvailableFilters,
    loadCurrentReports
  } = metricsStore

  const metricsGroups = computed(() => {
    return getGroupPages.value
  })

  const selectedGroup = computed(() => {
    return groupPageCurrent.value
  })

  const changeGroup = async (evt) => {
    resetFilters()
    setCurrentGroupPageByLabels(evt.value.label)
    await setDatasetAvailableFilters()
    await loadCurrentReports()
  }

  const groupPages = computed(() => {
    return getPages.value
  })

  const selectedPage = computed(() => {
    return groupPages.value?.findIndex((dashboard) => dashboard.id === pageCurrent.value?.id)
  })

  const changePage = async (evt) => {
    resetFilters()
    const selectedPage = groupPages.value[evt.index]
    setCurrentPage(selectedPage)
    await setDatasetAvailableFilters()
    await loadCurrentReports()
  }
</script>
<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown
      appendTo="self"
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
