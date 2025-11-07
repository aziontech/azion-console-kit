<template>
  <Dropdown
    ref="dropdownRef"
    v-model="internalValue"
    :options="options"
    :optionLabel="optionLabel"
    :optionValue="optionValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="isLoading"
    :filter="filter"
    :filterPlaceholder="filterPlaceholder"
    @show="onShow"
    @hide="onHide"
    @change="onChange"
    @filter="onFilter"
    class="w-full"
  >
    <template #empty>
      <div class="p-3 text-sm text-color-secondary">
        {{ emptyMessage }}
      </div>
    </template>
    <template #footer>
      <div
        ref="sentinelRef"
        class="h-1 w-full"
      ></div>
    </template>
  </Dropdown>
</template>

<script setup>
  import { ref, watch, computed, nextTick, onBeforeUnmount } from 'vue'
  import Dropdown from 'primevue/dropdown'

  const props = defineProps({
    modelValue: { type: [String, Number, Object, null], default: null },
    listService: { type: Function, required: true }, // async ({ page, size, search }) => { items, total }
    getByIdService: { type: Function, required: true }, // async (id) => item
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },
    pageSize: { type: Number, default: 25 },
    placeholder: { type: String, default: 'Select' },
    disabled: { type: Boolean, default: false },
    filter: { type: Boolean, default: true },
    filterPlaceholder: { type: String, default: 'Search' },
    emptyMessage: { type: String, default: 'No results' }
  })

  const emit = defineEmits(['update:modelValue', 'change'])

  const dropdownRef = ref(null)
  const sentinelRef = ref(null)
  const internalValue = ref(props.modelValue)
  const isOpen = ref(false)
  const isLoading = ref(false)
  const isAppending = ref(false)
  const page = ref(1)
  const total = ref(0)
  const search = ref('')
  const loadedIds = ref(new Set())
  const options = ref([])
  let intersectionObserver = null

  const hasMore = computed(() => options.value.length < total.value)

  const optionId = (opt) => opt?.[props.optionValue]

  const addOptions = (items) => {
    for (const item of items || []) {
      const id = optionId(item)
      if (!loadedIds.value.has(id)) {
        loadedIds.value.add(id)
        options.value.push(item)
      }
    }
  }

  const resetState = () => {
    page.value = 1
    total.value = 0
    loadedIds.value = new Set()
    options.value = []
  }

  const fetchPage = async ({ append } = { append: false }) => {
    if (isLoading.value || isAppending.value) return
    try {
      append ? (isAppending.value = true) : (isLoading.value = true)
      const { items = [], total: totalCount = 0 } = await props.listService({
        page: page.value,
        size: props.pageSize,
        search: search.value?.trim() || ''
      })
      total.value = totalCount
      addOptions(items)
      if (items.length > 0) page.value += 1
    } finally {
      isLoading.value = false
      isAppending.value = false
    }
  }

  const ensureSelectedLoaded = async () => {
    const id =
      typeof internalValue.value === 'object' ? optionId(internalValue.value) : internalValue.value
    if (id == null || loadedIds.value.has(id)) return
    try {
      const item = await props.getByIdService(id)
      if (item) addOptions([item])
    } catch (error) {
      // ignore fetch by id errors
    }
  }

  const onShow = async () => {
    isOpen.value = true
    if (options.value.length === 0) {
      await fetchPage({ append: false })
    }
    await ensureSelectedLoaded()
    await nextTick()
    setupObserver()
  }

  const onHide = () => {
    isOpen.value = false
    cleanupObserver()
  }

  const onChange = (event) => {
    emit('update:modelValue', event.value)
    emit('change', event)
  }

  const onFilter = async (event) => {
    const query = String(event?.value ?? '').trim()
    // Debounce-lite: ignore identical queries
    if (query === search.value) return
    search.value = query
    resetState()
    await fetchPage({ append: false })
    await ensureSelectedLoaded()
  }

  const setupObserver = () => {
    cleanupObserver()
    const el = sentinelRef.value
    if (!el) return
    intersectionObserver = new IntersectionObserver(
      async (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting && hasMore.value && isOpen.value) {
          await fetchPage({ append: true })
        }
      },
      { root: panelScrollableRoot(), threshold: 1.0 }
    )
    intersectionObserver.observe(el)
  }

  const panelScrollableRoot = () => {
    // Try to resolve the dropdown panel scroll container
    const overlay = dropdownRef.value?.$el?.querySelector?.('.p-dropdown-panel .p-dropdown-items')
    return overlay || null
  }

  const cleanupObserver = () => {
    if (intersectionObserver) {
      try {
        intersectionObserver.disconnect()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error disconnecting intersection observer:', error)
      }
      intersectionObserver = null
    }
  }

  watch(
    () => props.modelValue,
    async (val) => {
      internalValue.value = val
      if (isOpen.value) await ensureSelectedLoaded()
    }
  )

  onBeforeUnmount(() => {
    cleanupObserver()
  })
</script>
