<script setup>
  import Dropdown from 'primevue/dropdown'
  import Skeleton from 'primevue/skeleton'
  import TabMenu from 'primevue/tabmenu'
  import { computed } from 'vue'

  const props = defineProps({
    moduleActions: {
      type: Object,
      required: true
    },
    moduleGetters: {
      type: Object,
      required: true
    },
    groupData: {
      type: Object,
      required: true
    },
    userUTC: {
      type: String,
      required: true
    }
  })

  const {
    setCurrentGroupPageByLabels,
    resetFilters,
    setCurrentPage,
    setDatasetAvailableFilters,
    loadCurrentReports
  } = props.moduleActions

  const { getGroupPages, groupPageCurrent, getPages, pageCurrent } = props.moduleGetters

  const metricsGroups = computed(() => {
    return getGroupPages({ group: props.groupData })
  })

  const selectedGroup = computed(() => {
    return groupPageCurrent({ group: props.groupData })
  })

  const changeGroup = async ({ value }) => {
    const dataset = value.pagesDashboards?.[0]?.dashboards?.[0]?.dataset
    const currentDataset = currentPage.value?.dashboards?.[0]?.dataset

    if (dataset !== currentDataset) {
      resetFilters()
    }

    setCurrentGroupPageByLabels(value.label)
    await setDatasetAvailableFilters()
    await loadCurrentReports(props.userUTC)
  }

  const groupPages = computed(() => {
    return getPages({ group: props.groupData })
  })

  const currentPage = computed(() => {
    return pageCurrent({ group: props.groupData })
  })

  const selectedPage = computed(() => {
    return groupPages.value?.findIndex((dashboard) => dashboard.id === currentPage.value?.id)
  })

  const changePage = async (evt) => {
    if (evt.index === selectedPage.value) return

    const newPage = groupPages.value[evt.index]
    const dataset = newPage?.dashboards[0]?.dataset
    const currentDataset = currentPage.value?.dashboards[0]?.dataset

    if (dataset !== currentDataset) {
      resetFilters()
    }

    setCurrentPage(newPage)
    await setDatasetAvailableFilters()
    await loadCurrentReports(props.userUTC)
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
