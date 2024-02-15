<script setup>
  import Skeleton from 'primevue/skeleton'
  import { computed, onBeforeMount } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'

  const emit = defineEmits(['changeTab', 'update:tabIndex', 'update:modelValue'])

  const props = defineProps({
    tabs: {
      type: Array,
      required: true
    },
    tabIndex: {
      type: Number || String,
      default: 0
    },
    modelValue: {
      type: Object
    }
  })

  const route = useRoute()
  const router = useRouter()

  const tabSelectIndex = computed({
    get: () => props.tabIndex,
    set: (value) => {
      emit('update:tabIndex', value)
    }
  })

  const selectedPage = computed(() => {
    return props.tabs?.findIndex((tab) => tab.index === tabSelectIndex.value)
  })

  const changePage = async ({ index }) => {
    const tabSelectValue = findTabValueForIndex(index)
    selectedTab(tabSelectValue)
    emit('changeTab', tabSelectValue)
  }

  const updateRouter = (tabName) => {
    const { name, query, params } = route
    router.push({
      name,
      params: {
        ...params,
        tab: tabName
      },
      query
    })
  }

  const findTabValueForIndex = (tabIndex) => {
    return props.tabs?.find((tab) => tab.index === tabIndex)
  }

  const findTabValueForName = (tabName) => {
    return props.tabs?.find((tab) => tab.tabName === tabName)
  }

  const selectedTab = (tabSelectValue) => {
    tabSelectIndex.value = tabSelectValue.index
    emit('update:modelValue', tabSelectValue)
    updateRouter(tabSelectValue.tabName)
  }

  const tabSelectInitial = () => {
    const { params } = route

    if (params.tab) {
      const tabSelectValue = findTabValueForName(params.tab)
      selectedTab(tabSelectValue)
      return
    }

    const tabSelectValueForIndex = findTabValueForIndex(props.tabIndex)
    selectedTab(tabSelectValueForIndex)
  }

  onBeforeMount(() => {
    tabSelectInitial()
  })
</script>
<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Skeleton
      class="w-96 h-8"
      v-if="!tabs?.length"
    />
    <TabView
      v-else
      :activeIndex="selectedPage"
      class="w-full h-full"
      @tab-click="changePage"
    >
      <TabPanel
        v-for="itemTab in tabs"
        :key="itemTab.index"
        :header="itemTab.label"
      >
        <!-- <slot
          name="filter"
          :table="itemTab"
        />
        <slot
          name="body"
          :table="itemTab"
        /> -->
      </TabPanel>
    </TabView>
  </div>
</template>
