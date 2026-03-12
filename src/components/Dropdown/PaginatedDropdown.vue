<template>
  <LabelBlock
    v-if="label"
    :for="name"
    :label="label"
    :isRequired="$attrs.required"
  />
  <Dropdown
    ref="dropdownRef"
    v-model="internalValue"
    :options="options"
    :optionLabel="optionLabel"
    :optionValue="optionValue"
    :dataKey="optionValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :loading="isLoading"
    :id="name"
    :name="name"
    appendTo="self"
    :virtualScrollerOptions="{
      lazy: true,
      onLazyLoad: handleLazyLoad,
      itemSize: 38,
      showLoader: true,
      loading: isAppending || isLoading
    }"
    @show="onShow"
    @hide="onHide"
    @change="onChange"
    class="w-full"
    v-bind="$attrs"
  >
    <template #header>
      <div class="p-2 flex">
        <div class="p-inputgroup w-full">
          <InputText
            type="text"
            v-model="search"
            :placeholder="filterPlaceholder"
            class="w-full"
          />
          <span class="p-inputgroup-addon">
            <i class="pi pi-search"></i>
          </span>
        </div>
      </div>
    </template>
    <template #empty>
      <div class="p-3 text-sm text-color-secondary">
        {{ emptyMessage }}
      </div>
    </template>
    <template #value="slotProps">
      <span class="flex align-items-center gap-2">
        <template v-if="getSelectedOption(slotProps.value)">
          <i
            v-if="getSelectedOption(slotProps.value)?.icon"
            :class="`pi ${getSelectedOption(slotProps.value).icon} ${applyIconColor(
              getSelectedOption(slotProps.value).icon
            )}`"
          ></i>
          {{
            getSelectedOption(slotProps.value)?.[optionLabel] ||
            getSelectedOption(slotProps.value)?.name ||
            ''
          }}
        </template>
        <template v-else>
          {{ placeholder }}
        </template>
      </span>
    </template>
    <template #option="slotProps">
      <div class="flex align-items-center gap-2">
        <i
          v-if="slotProps.option.icon"
          :class="`pi ${slotProps.option.icon} ${applyIconColor(slotProps.option.icon)}`"
        ></i>
        <span
          v-else-if="!slotProps.option.icon && showIcon"
          class="w-4"
        ></span>
        <div>{{ slotProps.option[optionLabel] || slotProps.option.name }}</div>
      </div>
    </template>
    <template #footer>
      <slot name="footer" />
    </template>
  </Dropdown>
</template>

<script setup>
  import { ref, watch, computed, nextTick, onMounted } from 'vue'
  import { watchDebounced } from '@vueuse/core'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import LabelBlock from '@/templates/label-block'
  import {
    buildListParams,
    markEndOfData,
    isEndOfList as utilIsEndOfList,
    addUniqueItems,
    createSelectPayload as utilCreateSelectPayload
  } from './utils'

  const props = defineProps({
    modelValue: { type: [String, Number, Object, null], default: null },
    listService: { type: Function, required: true },
    getByIdService: { type: Function, required: true },
    optionLabel: { type: String, default: 'label' },
    optionValue: { type: String, default: 'value' },
    name: { type: String, default: '' },
    label: { type: String, default: '' },
    pageSize: { type: Number, default: 100 },
    placeholder: { type: String, default: 'Select' },
    disabled: { type: Boolean, default: false },
    filter: { type: Boolean, default: true },
    filterPlaceholder: { type: String, default: 'Search' },
    emptyMessage: { type: String, default: 'No results' },
    showIcon: { type: Boolean, default: false },
    iconColor: { type: Object, default: () => ({}) },
    moreOptions: { type: Array, default: () => [] }
  })

  const emit = defineEmits(['update:modelValue', 'onSelectOption'])

  const dropdownRef = ref(null)
  const internalValue = ref(props.modelValue)
  const isOpen = ref(false)
  const isLoading = ref(false)
  const isAppending = ref(false)
  const page = ref(1)
  const total = ref(0)
  const search = ref('')
  const loadedIds = ref(new Set())
  const options = ref([])
  const noMore = ref(false)

  const SEARCH_DEBOUNCE = 500
  const SEARCH_MAX_WAIT = 1000
  const NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH = 3
  const NUMBER_OF_CHARACTERS_TO_RESET_SEARCH = 0

  const hasMore = computed(
    () => !noMore.value && (total.value === 0 || options.value.length < total.value)
  )
  const optionId = (opt) => opt?.[props.optionValue]
  const applyIconColor = (icon) => props.iconColor?.[icon] || ''
  const deriveId = (val) => (typeof val === 'object' ? optionId(val) : val)
  const findOptionById = (id) => options.value.find((opt) => optionId(opt) === id) || null
  const getSelectedOption = (val) => {
    if (val == null) return null
    const id = deriveId(val)
    if (id == null) return null
    return findOptionById(id)
  }
  const buildParams = () =>
    buildListParams({
      page: page.value,
      pageSize: props.pageSize,
      search: search.value,
      ordering: 'name'
    })

  /**
   * Add options to the list, ensuring uniqueness.
   * @param {Array} items - Options to add.
   * @param {Object} options - Options object.
   * @param {Boolean} options.prepend - Whether to prepend the new options.
   */
  const addOptions = (items, { prepend = false } = {}) => {
    options.value = addUniqueItems({
      items: items || [],
      existing: options.value,
      loadedIds: loadedIds.value,
      optionValue: props.optionValue,
      prepend
    })
  }

  /**
   * Reset the state of the component.
   */
  const resetState = () => {
    page.value = 1
    total.value = 0
    loadedIds.value = new Set()
    options.value = []
    noMore.value = false
  }

  /**
   * Fetch a page of options.
   * @param {{ append?: boolean }} param0
   */
  const fetchPage = async ({ append } = { append: false }) => {
    if (isLoading.value || isAppending.value) return
    if (append && noMore.value) return
    try {
      append ? (isAppending.value = true) : (isLoading.value = true)
      const { body = [], count = 0 } = await props.listService(buildParams())
      total.value = count
      addOptions(body)
      if (body.length > 0) page.value += 1
      markEndOfData(body.length)
    } finally {
      isLoading.value = false
      isAppending.value = false
    }
  }

  /** Ensure the currently selected value exists in options (load by id if missing).
   * Skips when a search is active to avoid polluting filtered results.
   */
  const ensureSelectedLoaded = async () => {
    if (search.value && search.value.trim().length > 0) return
    const id = deriveId(internalValue.value)
    if (id == null || loadedIds.value.has(id)) return
    try {
      const item = await props.getByIdService({ id })
      if (item) addOptions([item], { prepend: true })
    } catch (error) {
      // ignore fetch by id errors
    }
  }

  /** Panel open handler: do not fetch; data is prefetched on mount. */
  const onShow = async () => {
    isOpen.value = true
    await nextTick()
  }

  const onHide = () => {
    isOpen.value = false
  }

  const onChange = (event) => {
    const val = event.value
    emit('update:modelValue', val)
    emit(
      'onSelectOption',
      utilCreateSelectPayload(val, {
        moreOptions: props.moreOptions,
        optionValue: props.optionValue,
        options: options.value
      })
    )
  }

  const isEndOfList = (last) =>
    utilIsEndOfList({ lastIndex: last, optionsLength: options.value.length })
  const canAppend = () => isOpen.value && hasMore.value && !isLoading.value && !isAppending.value
  const handleLazyLoad = async (event) => {
    const { last } = event || {}
    if (!isEndOfList(last)) return
    if (!canAppend()) return
    await fetchPage({ append: true })
  }

  watch(
    () => props.modelValue,
    async (val) => {
      internalValue.value = val
      await ensureSelectedLoaded()
    }
  )

  onMounted(async () => {
    // Prefetch first page to avoid delay on open
    if (!options.value.length) {
      await fetchPage({ append: false })
    }
    // Ensure selected value (if any) is available in options
    await ensureSelectedLoaded()
  })

  watchDebounced(
    search,
    async () => {
      if (
        search.value.length >= NUMBER_OF_CHARACTERS_MIN_FOR_SEARCH ||
        search.value.length === NUMBER_OF_CHARACTERS_TO_RESET_SEARCH
      ) {
        resetState()
        await fetchPage({ append: false })
      }
    },
    { debounce: SEARCH_DEBOUNCE, maxWait: SEARCH_MAX_WAIT }
  )
</script>
