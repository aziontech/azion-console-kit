<template>
  <div>
    <PickList
      :modelValue="[filteredSource, filteredTarget]"
      :disabled="disabled"
      @update:modelValue="onPickListUpdate"
      :pt="{
        sourceList: { class: ['h-80'] },
        targetList: { class: ['h-80'] },
        sourceWrapper: { class: 'max-w-[340px]' },
        targetWrapper: { class: 'max-w-[340px]' }
      }"
      :dataKey="dataKey"
      breakpoint="1400px"
      :showSourceControls="false"
      :showTargetControls="false"
      data-testid="picklist__field"
      :move-all-to-source-props="{
        'data-testid': 'picklist__move-all-to-source-btn'
      }"
      :move-all-to-target-props="{
        'data-testid': 'picklist__move-all-to-target-btn'
      }"
      :move-to-target-props="{
        'data-testid': 'picklist__move-to-target-btn'
      }"
      :move-to-source-props="{
        'data-testid': 'picklist__move-to-source-btn'
      }"
    >
      <template #sourceheader>
        <div class="flex flex-col w-full">
          <span class="mb-4">Available {{ title }}</span>

          <Divider class="ml-[-16px] w-[calc(100%+32px)]" />

          <span class="p-input-icon-right w-full mt-4">
            <i class="pi pi-search text-[var(--text-color-secondary)]" />
            <InputText
              class="h-8 w-full"
              v-model.trim="searchSource"
              data-testid="search-input-source"
              placeholder="Search"
            />
          </span>
        </div>
      </template>
      <template #targetheader>
        <div class="flex flex-col w-full">
          <span class="mb-4">Chosen {{ title }}</span>

          <Divider class="ml-[-16px] w-[calc(100%+32px)]" />

          <span class="p-input-icon-right w-full mt-4">
            <i class="pi pi-search text-[var(--text-color-secondary)]" />
            <InputText
              class="h-8 w-full"
              v-model.trim="searchTarget"
              data-testid="search-input-target"
              placeholder="Search"
            />
          </span>
        </div>
      </template>

      <template #item="slotProps">
        <div class="flex flex-wrap pl-3 align-items-center gap-3 py-2">
          <div
            class="flex-1 flex flex-column gap-2"
            v-if="!slotProps.item?.loading"
          >
            <span
              class="regular-400 line-height-auto"
              data-testid="picklist_name-item"
              >{{ slotProps.item.name }}
            </span>
          </div>
          <div
            class="flex-1 flex flex-column gap-2"
            v-else
          >
            <ProgressSpinner style="width: 25px; height: 25px" />
          </div>
        </div>
      </template>
    </PickList>
  </div>
</template>

<script setup>
  import PickList from 'primevue/picklist'
  import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
  import ProgressSpinner from 'primevue/progressspinner'
  import InputText from 'primevue/inputtext'
  import { watchDebounced } from '@vueuse/core'
  import Divider from 'primevue/divider'

  const props = defineProps({
    disabled: {
      type: Boolean
    },
    dataPick: {
      type: Array,
      default: () => [[], []]
    },
    dataKey: {
      type: String,
      required: true
    },
    title: {
      type: String
    },
    service: {
      type: Function
    }
  })
  let scrollElement = null
  const PAGE_SIZE = 100
  const page = ref(1)
  const PAGE_INCREMENT = 1
  const notRequest = ref(false)
  const NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH = 3
  const NUMBER_OF_CHARACTERS_TO_RESET_SEARCH = 0
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000
  const searchSource = ref('')
  const searchTarget = ref('')
  const originalSource = ref([])
  const originalTargert = ref([])
  const data = ref(props.dataPick)
  const loading = ref(false)
  const addUniqueItems = (targetArray, itemsToAdd) => {
    const existingIds = new Set(targetArray.map((item) => item.id))
    itemsToAdd.forEach((item) => {
      if (!existingIds.has(item.id)) {
        data.value[0].push(item)
      }
    })
  }
  const handleLazyLoad = async () => {
    if (!notRequest.value) {
      page.value += PAGE_INCREMENT
      await fetchData(page.value)
      if (!searchSource.value) {
        originalSource.value = [...data.value[0]]
      }
    }
  }
  const handleScroll = (event) => {
    const element = event.target
    const isBottom = element.scrollTop + element.clientHeight >= element.scrollHeight
    if (isBottom && !loading.value) {
      handleLazyLoad()
    }
  }
  const filteredSource = computed(() => {
    return data.value[0]
  })
  const filteredTarget = computed(() => {
    return data.value[1]?.filter((item) =>
      item.name.toLowerCase().includes(searchTarget.value.toLowerCase())
    )
  })
  const handleSelectItemWithSearch = () => {
    const idsParaRemover = new Set(data.value[1].map((item) => item.id))
    data.value[0] = originalSource.value.filter((item) => !idsParaRemover.has(item.id))
    originalSource.value = data.value[0]
  }
  const setOrigionalTarget = (target) => {
    originalTargert.value = target
  }
  const handleSelectItemWithSearchTarget = (targets) => {
    const map = new Map()
    originalTargert.value.forEach((item) => {
      map.set(item.id, item)
    })
    targets.forEach((item) => {
      map.set(item.id, item)
    })
    data.value[1] = Array.from(map.values())
  }
  function onPickListUpdate([newSource, newTarget]) {
    data.value[0] = newSource
    data.value[1] = newTarget
    if (searchSource.value) {
      handleSelectItemWithSearch()
    } else {
      originalSource.value = [...data.value[0]]
    }
    if (searchTarget.value) {
      handleSelectItemWithSearchTarget(newTarget)
    } else {
      setOrigionalTarget(newTarget)
    }
  }
  const searchFilter = () => {
    const pageToSearch = 1
    data.value[0] = []
    if (!searchSource.value) {
      data.value[0] = [...originalSource.value]
      return
    }
    fetchData(pageToSearch)
  }
  const loadingPickList = () => {
    data.value[0].push({ id: 0, loading: true })
  }
  const removeLoadingPickList = () => {
    data.value[0].pop()
  }
  const fetchData = async (currentPage = 1) => {
    loading.value = true
    loadingPickList()
    try {
      const response = await props.service({
        pageSize: PAGE_SIZE,
        fields: 'id, name',
        page: currentPage,
        search: searchSource.value,
        ordering: 'name'
      })
      // remove load item
      removeLoadingPickList()
      const dataPicks = [...data.value[0], ...data.value[1]]
      addUniqueItems(dataPicks, response.results)
    } catch (error) {
      notRequest.value = true
      removeLoadingPickList()
    } finally {
      loading.value = false
    }
  }
  watchDebounced(
    searchSource,
    () => {
      if (
        searchSource.value.length >= NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH ||
        searchSource.value.length === NUMBER_OF_CHARACTERS_TO_RESET_SEARCH
      ) {
        searchFilter()
      }
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )
  const calculatePage = () => {
    const sourceTotal = props.dataPick[0].length
    const targetTotal = props.dataPick[1].length
    const total = sourceTotal + targetTotal
    const result = Math.ceil(total / PAGE_SIZE)
    page.value = result > 1 ? result : 1
  }
  onMounted(async () => {
    await nextTick()
    scrollElement = document.querySelector('.p-picklist-source-list')
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
    }
    originalSource.value = [...props.dataPick[0]]
    const shouldFetchMoreItems = props.dataPick[0].length < 6
    if (shouldFetchMoreItems) {
      calculatePage()
      const response = await props.service({
        pageSize: PAGE_SIZE,
        fields: 'id, name',
        page: page.value,
        ordering: 'name'
      })
      const dataPicks = [...data.value[0], ...data.value[1]]
      addUniqueItems(dataPicks, response.results)
      originalSource.value = [...data.value[0]]
    }
  })
  onBeforeUnmount(() => {
    if (scrollElement) {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  })
</script>

<style>
.p-picklist-source-wrapper .p-picklist-list li,
.p-picklist-target-wrapper .p-picklist-list li {
  padding: 0 !important;
}
</style>