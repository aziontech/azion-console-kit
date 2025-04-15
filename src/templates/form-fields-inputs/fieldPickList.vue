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
      dataKey="domainID"
      breakpoint="1400px"
      :showSourceControls="false"
      :showTargetControls="false"
      data-testid="data-stream-form__domains__domains-field"
      :move-all-to-source-props="{
        'data-testid': 'data-stream-form__domains-field-picklist__move-all-to-source-btn'
      }"
      :move-all-to-target-props="{
        'data-testid': 'data-stream-form__domains-field-picklist__move-all-to-target-btn'
      }"
      :move-to-target-props="{
        'data-testid': 'data-stream-form__domains-field-picklist__move-to-target-btn'
      }"
      :move-to-source-props="{
        'data-testid': 'data-stream-form__domains-field-picklist__move-to-source-btn'
      }"
    >
      <template #sourceheader>
        <div class="flex flex-col gap-2">
          <span>Available {{ title }}</span>
          <InputText
            class="h-8 w-full md:min-w-[20rem]"
            v-model.trim="searchSource"
            data-testid="data-table-search-input"
            placeholder="Search"
          />
        </div>
      </template>
      <template #targetheader>
        <div class="flex flex-col gap-2">
          <span>Chosen {{ title }}</span>
          <InputText
            class="h-8 w-full md:min-w-[20rem]"
            v-model.trim="searchTarget"
            data-testid="data-table-search-input"
            placeholder="Search"
          />
        </div>
      </template>

      <template #item="slotProps">
        <div class="flex flex-wrap p-2 pl-0 align-items-center gap-3 max-w-xs">
          <div
            class="flex-1 flex flex-column gap-2"
            v-if="!slotProps.item?.loading"
          >
            <span
              class="font-normal"
              data-testid="data-stream-form__domains__domains-name"
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

  const props = defineProps({
    disabled: {
      type: Boolean
    },
    dataPick: {
      type: Array,
      default: () => [[], []]
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
  const searchSource = ref('')
  const searchTarget = ref('')
  const NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH = 3
  const NUMBER_OF_CHARACTERS_TO_RESET_SEARCH = 0
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000

  const data = ref(props.dataPick)
  const loading = ref(false)
  const addUniqueItems = (targetArray, itemsToAdd) => {
    const existingIds = new Set(targetArray.map((item) => item.id))

    itemsToAdd.forEach((item) => {
      if (!existingIds.has(item.id)) {
        targetArray.push(item)
      }
    })
  }

  const handleLazyLoad = async () => {
    if (!notRequest.value) {
      page.value += PAGE_INCREMENT
      await fetchData(page.value)
    }
  }

  const handleScroll = (event) => {
    const element = event.target
    const isBottom = element.scrollTop + element.clientHeight >= element.scrollHeight

    if (isBottom) {
      handleLazyLoad()
    }
  }

  const filteredSource = computed(() => {
    return data.value[0]
  })

  const filteredTarget = computed(() => {
    return data.value[1].filter((item) =>
      item.name.toLowerCase().includes(searchTarget.value.toLowerCase())
    )
  })

  function onPickListUpdate([newSource, newTarget]) {
    data.value[0] = newSource
    data.value[1] = newTarget
  }

  const searchFilter = () => {
    data.value[0] = []

    fetchData(1)
  }

  const fetchData = async (currentPage = 1) => {
    loading.value = true
    addUniqueItems(data.value[0], [{ id: 0, loading: true }])

    try {
      const response = await props.service({
        pageSize: PAGE_SIZE,
        page: currentPage,
        search: searchSource.value,
        ordering: 'name'
      })
      // remove load item
      data.value[0].pop()
      addUniqueItems(data.value[0], response.results)
    } catch (error) {
      notRequest.value = true
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

  onMounted(async () => {
    await nextTick()

    scrollElement = document.querySelector('.p-picklist-source-list')
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
    }
  })

  onBeforeUnmount(() => {
    if (scrollElement) {
      scrollElement.removeEventListener('scroll', handleScroll)
    }
  })
</script>
