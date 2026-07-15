<script setup>
  /**
   * LazyResourceSelectField — server-paginated, server-searched resource picker.
   * `service({ page, pageSize, search, ordering }) => { body, count }`;
   * `loadService(id) => { id, name }` resolves a pre-selected value beyond page 1.
   */
  import { computed, onMounted, ref, watch } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'

  defineOptions({ name: 'release-lazy-resource-select-field' })

  const props = defineProps({
    modelValue: {
      type: [String, Number],
      default: null
    },
    service: {
      type: Function,
      default: null
    },
    loadService: {
      type: Function,
      default: null
    },
    label: {
      type: String,
      default: 'Resource'
    },
    placeholder: {
      type: String,
      default: 'Select a resource'
    },
    disabled: {
      type: Boolean,
      default: false
    },
    required: {
      type: Boolean,
      default: true
    },
    clearable: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const PAGE_SIZE = 100
  const INITIAL_PAGE = 1
  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000
  const MIN_SEARCH_LENGTH = 3
  // Prefetch the next page once the user scrolls past this fraction of the loaded
  // items (before the end), silently, so the data is usually ready before they
  // reach the bottom.
  const LOAD_MORE_THRESHOLD_RATIO = 0.7

  const data = ref([])
  const page = ref(INITIAL_PAGE)
  const totalCount = ref(0)
  const search = ref('')
  // `loading`: initial/search load (list is empty). `loadingMore`: next-page
  // append in flight — the loaded list stays visible; a loading row shows at the
  // end ONLY if the user has scrolled to it (see `showLoadingRow`).
  const loading = ref(false)
  const loadingMore = ref(false)
  // Last item index the virtual scroller reported as visible; used to tell whether
  // the user has actually reached the end of the loaded list.
  const lastVisibleIndex = ref(-1)

  const toText = (name) => (name && typeof name === 'object' ? (name.text ?? '') : (name ?? ''))

  const toOption = (item) => ({
    label: toText(item.name) || String(item.id),
    value: item.id
  })

  const fetchData = async (currentPage = INITIAL_PAGE) => {
    if (!props.service) return
    const isFirstPage = currentPage === INITIAL_PAGE
    // First page clears + shows the empty/loading state; a next page keeps the
    // current list on screen and only flags the footer spinner.
    if (isFirstPage) {
      loading.value = true
      data.value = []
    } else {
      loadingMore.value = true
    }
    try {
      const response = await props.service({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: search.value,
        ordering: 'name'
      })
      totalCount.value = response?.count ?? 0
      const results = (Array.isArray(response?.body) ? response.body : []).map(toOption)
      if (isFirstPage) {
        data.value = results
      } else {
        // Append below the last item of the previous page (deduped) so the
        // current view never shifts.
        const seen = new Set(data.value.map((option) => String(option.value)))
        data.value = [...data.value, ...results.filter((option) => !seen.has(String(option.value)))]
      }
      if (isFirstPage && !search.value) await ensureSelectedInList(props.modelValue)
    } catch {
      // Keep whatever is loaded; the composer surfaces catalog errors separately.
    } finally {
      if (isFirstPage) loading.value = false
      else loadingMore.value = false
    }
  }

  const handleLazyLoad = async (event) => {
    const { last } = event
    // Track scroll position on every range change (even when we don't fetch) so
    // `showLoadingRow` knows when the user is actually at the end.
    lastVisibleIndex.value = last
    const numberOfPages = Math.ceil(totalCount.value / PAGE_SIZE)
    const reachedThreshold = last >= data.value.length * LOAD_MORE_THRESHOLD_RATIO
    if (page.value < numberOfPages && reachedThreshold && !loading.value && !loadingMore.value) {
      page.value += 1
      await fetchData(page.value)
    }
  }

  // The loading row is a bottom-of-list item shown ONLY when the user reached the
  // end of the loaded items and the next page is still loading; it is replaced by
  // the appended items once they arrive (`loadingMore` clears / the list grows).
  const showLoadingRow = computed(
    () => loadingMore.value && lastVisibleIndex.value >= data.value.length - 1
  )

  const ensureSelectedInList = async (value) => {
    if (value == null || value === '' || !props.loadService) return
    const exists = data.value.some((option) => String(option.value) === String(value))
    if (exists) return
    try {
      const item = await props.loadService(value)
      if (item?.id == null) return
      const option = toOption(item)
      if (!data.value.some((existing) => String(existing.value) === String(option.value))) {
        data.value = [option, ...data.value]
      }
    } catch {
      // Leave the raw id visible rather than blocking on a failed lookup.
    }
  }

  const onChange = (value) => emit('update:modelValue', value)

  watchDebounced(
    search,
    () => {
      if (search.value.length >= MIN_SEARCH_LENGTH || search.value.length === 0) {
        page.value = INITIAL_PAGE
        fetchData(INITIAL_PAGE)
      }
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )

  watch(
    () => props.modelValue,
    (value) => ensureSelectedInList(value)
  )

  onMounted(() => fetchData(INITIAL_PAGE))

  // No `showLoader`/`loading` here: the built-in loader replaces the rows with
  // skeletons. Next-page progress is shown as a loading row at the end of the
  // list instead, keeping the loaded list on screen while the append happens.
  const VIRTUAL_SCROLLER_OPTIONS = {
    lazy: true,
    onLazyLoad: handleLazyLoad,
    itemSize: 38
  }
</script>

<template>
  <div class="flex w-full min-w-0 flex-col gap-[var(--spacing-2)]">
    <label
      class="flex items-center gap-[var(--spacing-1)] text-body-sm font-medium text-[var(--text-color-secondary)]"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-[var(--color-orange-500)]"
        aria-hidden="true"
        >*</span
      >
    </label>
    <Dropdown
      :modelValue="modelValue"
      :options="data"
      optionLabel="label"
      optionValue="value"
      appendTo="body"
      :placeholder="placeholder"
      :loading="loading"
      :disabled="disabled"
      :showClear="clearable"
      scrollHeight="240px"
      :virtualScrollerOptions="VIRTUAL_SCROLLER_OPTIONS"
      class="release-composition-control release-lazy-select w-full"
      data-testid="release-composition__resource-select"
      @update:modelValue="onChange"
    >
      <template #dropdownicon>
        <i class="pi pi-chevron-down text-body-sm text-[var(--text-color-secondary)]" />
      </template>

      <template #value="{ value }">
        <span
          v-if="value != null && value !== ''"
          class="block truncate text-body-sm text-[var(--text-color)]"
          >{{
            (data.find((option) => String(option.value) === String(value)) || {}).label ?? value
          }}</span
        >
        <span
          v-else
          class="block truncate text-body-sm text-[var(--text-color-secondary)]"
          >{{ placeholder }}</span
        >
      </template>

      <template #header>
        <div class="p-[var(--spacing-2)]">
          <span class="relative block w-full">
            <i
              class="pi pi-search absolute left-[var(--spacing-3)] top-1/2 -translate-y-1/2 text-body-sm text-[var(--text-color-secondary)]"
            />
            <InputText
              v-model="search"
              type="text"
              placeholder="Search"
              class="w-full pl-[var(--spacing-8)]"
              data-testid="release-composition__resource-select-search"
            />
          </span>
        </div>
      </template>

      <template #option="{ option }">
        <span class="block truncate text-body-sm text-[var(--text-color)]">{{ option.label }}</span>
      </template>

      <template #empty>
        <span
          class="block px-[var(--spacing-3)] py-[var(--spacing-2)] text-body-sm text-[var(--text-color-secondary)]"
        >
          {{ loading ? 'Loading…' : 'No available options' }}
        </span>
      </template>

      <template #footer>
        <div
          v-if="showLoadingRow"
          class="flex min-h-[38px] items-center justify-center gap-[var(--spacing-2)] px-[var(--spacing-3)] text-body-sm text-[var(--text-color-secondary)]"
          data-testid="release-composition__resource-select-loading-more"
        >
          <i class="pi pi-spin pi-spinner" />
          Loading more…
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<style scoped>
  :deep(.release-composition-control) {
    background: var(--surface-section) !important;
    border-color: var(--surface-border) !important;
  }

  /* Match the webkit ResourceVersionField dropdown (h-10 / 40px) so the Resource
     and Version selectors line up — mirrors CanaryStrategyField's normalization. */
  :deep(.release-composition-control.p-dropdown) {
    height: 40px;
    min-height: 40px;
  }

  :deep(.release-composition-control .p-dropdown-label) {
    display: flex;
    align-items: center;
  }
</style>
