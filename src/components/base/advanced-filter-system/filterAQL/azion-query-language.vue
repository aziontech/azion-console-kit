<template>
  <div
    class="w-full relative"
    ref="ignoreClickOutside"
  >
    <div class="relative">
      <div class="flex gap-2 items-center justify-center">
        <ContentEditable
          v-model="query"
          @focus="openSuggestions"
          @keydown.tab="onSelectSuggestionWithTab"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="confirmSelection"
          @keydown.esc.prevent="showSuggestionsFocusInput = false"
          @keydown.ctrl.space.prevent="openSuggestions"
          @keydown.meta.space.prevent="openSuggestions"
          @external-link="handleExternalLink"
          @search="handleSearch"
          :handleQuery="handleQuery"
          ref="editable"
          data-testid="azion-query-language-input"
        />
      </div>
      <div
        class="flex flex-col mt-2 gap-1"
        v-if="handleErrorsQuery.length"
      >
        <small
          v-for="(error, index) in handleErrorsQuery"
          :key="index"
          class="p-error text-xs font-normal leading-tight"
          data-testid="azion-query-language-errors"
        >
          {{ error }}
        </small>
      </div>
    </div>

    <!-- Unified dropdown: suggestions + recent queries -->
    <div
      v-if="(filteredSuggestions.length && showSuggestionsFocusInput) || showRecentQueries"
      class="aql-dropdown-panel"
    >
      <!-- Field/operator/value suggestions -->
      <Listbox
        v-if="filteredSuggestions.length && showSuggestionsFocusInput"
        :options="filteredSuggestions"
        ref="listboxRef"
        optionLabel="label"
        :modelValue="listboxModel"
        class="w-full max-h-48 overflow-y-auto"
        @update:modelValue="onListboxModelUpdate"
        data-testid="azion-query-language-suggestions"
        :pt="{
          root: { class: 'p-0 border-none shadow-none' },
          list: { 'data-testid': 'azion-query-language-suggestions-list' },
          item: { class: 'p-0' }
        }"
      >
        <template #option="slotProps">
          <div
            class="w-full rounded-md"
            style="font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace"
            :data-testid="`azion-query-language-list-item${slotProps.index}`"
            @mousedown.prevent.stop="onOptionMouseDown(slotProps.option)"
            :class="[
              'p-2 cursor-pointer',
              {
                'bg-[var(--dropdown-hover-bg)] text-[var(--dropdown-hover-text)]':
                  slotProps.index === highlightedIndex
              }
            ]"
          >
            {{ slotProps.option.label }}
          </div>
        </template>
      </Listbox>

      <!-- Recent queries -->
      <div
        v-if="showRecentQueries"
        class="aql-recent-queries hidden md:block"
        data-testid="aql-recent-queries"
      >
        <div class="aql-recent-queries__header">
          <span class="aql-recent-queries__title">Recent queries</span>
          <button
            class="aql-recent-queries__clear"
            @mousedown.prevent="clearQueryHistory"
          >
            <i class="pi pi-trash" />
          </button>
        </div>
        <ul class="aql-recent-queries__list">
          <li
            v-for="(entry, idx) in queryHistory.slice(0, 8)"
            :key="idx"
            class="aql-recent-queries__item"
            @mousedown.prevent="loadFromHistory(entry)"
          >
            <i class="pi pi-history aql-recent-queries__icon" />
            <span class="aql-recent-queries__query">
              <template
                v-for="(part, fIdx) in getAqlHistoryParts(entry)"
                :key="fIdx"
              >
                <template v-if="fIdx > 0">
                  <span class="aql-recent-queries__and"> AND </span>
                </template>
                <span>{{ part.field }}</span>
                <span
                  v-if="part.operator"
                  class="aql-recent-queries__dataset"
                  >{{ part.operator }}</span
                >
                <span>{{ part.value }}</span>
              </template>
            </span>
            <span
              v-if="entry.dataset"
              class="aql-recent-queries__dataset"
              >{{ entry.dataset }}</span
            >
            <button
              class="aql-recent-queries__remove"
              @mousedown.prevent.stop="removeQueryFromHistory(idx)"
            >
              <i class="pi pi-times" />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, nextTick, watch } from 'vue'
  import ContentEditable from './content-editable.vue'
  import Listbox from '@aziontech/webkit/listbox'
  import Aql from './azion-query-language.js'
  import { OPERATOR_MAPPING_ADVANCED_FILTER } from '@/templates/advanced-filter/component/index'
  import { onClickOutside } from '@vueuse/core'
  import { listWorkloadsDynamicFieldsService } from '@/services/workloads-services/list-workloads-dynamic-fields-service.js'
  import { useQueryHistory } from '@/views/RealTimeEvents/composables/useQueryHistory'

  import { OPERATOR_MAPPING } from '@/components/base/advanced-filter-system/filterFields/filterRow/component'

  const AzionQueryLanguage = new Aql()

  const query = ref('')
  const currentStep = ref('field')
  const selectedFieldName = ref('')
  const highlightedIndex = ref(0)
  const listboxRef = ref(null)
  const domains = ref([])

  const listboxModel = ref(null)

  const showSuggestionsFocusInput = ref(false)
  const ignoreClickOutside = ref('ignoreClickOutside')

  const editable = ref(null)

  const {
    history: queryHistory,
    addQuery: addQueryToHistory,
    removeQuery: removeQueryFromHistory,
    clearHistory: clearQueryHistory
  } = useQueryHistory()

  // Show recent queries section when input is focused and there's history
  const showRecentQueries = computed(() => {
    return showSuggestionsFocusInput.value && queryHistory.value.length > 0
  })

  const emit = defineEmits(['dirty', 'validation'])

  defineOptions({ name: 'azion-query-language' })

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    searchAdvancedFilter: {
      type: Function,
      required: true
    },
    filterAdvanced: {
      type: Array,
      required: true
    },
    dataset: {
      type: String,
      default: ''
    }
  })

  onMounted(async () => {
    if (props.fieldsInFilter.length) handleInitialQuery()
    await loaderDomainWorkloads()
  })

  const suggestionsData = computed(() => {
    return props.fieldsInFilter.map(
      ({ label, value, description, operator, disabled, mostRelevant = 0 }) => {
        return {
          label,
          mostRelevant,
          value: {
            disabled,
            description,
            value,
            label,
            operator: operator.map(
              ({ props, placeholder, type, value: valueOp, disabled: disabledOp }) => {
                const {
                  value: valueLabel,
                  label: labelOp,
                  format
                } = OPERATOR_MAPPING_ADVANCED_FILTER[valueOp]
                return {
                  label: labelOp,
                  value: {
                    disabled: disabledOp,
                    placeholder,
                    value: valueLabel,
                    props,
                    format,
                    type
                  }
                }
              }
            )
          }
        }
      }
    )
  })

  const filteredSuggestions = computed(() => {
    const suggestions = suggestionsData.value
    const field = selectedFieldName.value

    switch (currentStep.value) {
      case 'field':
        return AzionQueryLanguage.getFieldSuggestions(query.value, suggestions)
      case 'operator':
        return AzionQueryLanguage.getOperatorSuggestions(query.value, suggestions, field)
      case 'value':
        return AzionQueryLanguage.getValueSuggestions(domains.value, field)
      case 'logicOperator':
        return [{ label: 'AND' }, { label: 'OR' }]
      default:
        return []
    }
  })

  const loaderDomainWorkloads = async () => {
    try {
      const response = await listWorkloadsDynamicFieldsService({ fields: 'id,name' })
      domains.value = response.results.map((el) => {
        return {
          label: el.name,
          id: el.id
        }
      })
    } catch (error) {
      return []
    }
  }

  const openSuggestions = () => {
    handleQuery({ useCursorOffset: true })
    showSuggestionsFocusInput.value = true
  }

  const handleQuery = ({ useCursorOffset = false } = {}) => {
    const cursorOffset = useCursorOffset ? editable.value?.getCursorOffset?.() : null
    const queryForMatch =
      typeof cursorOffset === 'number' ? query.value?.slice(0, cursorOffset) : query.value
    const handleInputMaching = AzionQueryLanguage.handleInputMatching(
      queryForMatch,
      suggestionsData.value
    )
    changeCurrentStep(handleInputMaching.operator)
    selectedFieldName.value = handleInputMaching.selectedField
  }

  const selectSuggestion = (suggestion) => {
    const data = AzionQueryLanguage.selectSuggestion(
      suggestion,
      query.value,
      currentStep.value,
      selectedFieldName.value
    )
    query.value = data?.query
    selectedFieldName.value = data?.label
    changeCurrentStep(data?.nextStep)
    highlightedIndex.value = 0
  }

  const onListboxModelUpdate = (modelValue) => {
    listboxModel.value = modelValue
    selectSuggestion(modelValue)
  }

  const onOptionMouseDown = (option) => {
    const restoreCursorInLastOffset = true
    onListboxModelUpdate(option)
    editable.value?.restoreCursorPosition?.(restoreCursorInLastOffset)
  }

  const scrollToHighlighted = () => {
    nextTick(() => {
      const container = listboxRef.value?.$el || listboxRef.value
      if (container) {
        const highlightedItem = container.querySelector('.bg-orange-base')
        if (highlightedItem) {
          highlightedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        }
      }
    })
  }

  const highlightNext = () => {
    if (highlightedIndex.value < filteredSuggestions.value.length - 1) {
      highlightedIndex.value++
      scrollToHighlighted()
    }
  }

  const highlightPrev = () => {
    if (highlightedIndex.value > 0) {
      highlightedIndex.value--
      scrollToHighlighted()
    }
  }

  const confirmSelection = () => {
    const suggestion = filteredSuggestions.value[highlightedIndex.value]

    if (suggestion && showSuggestionsFocusInput.value) {
      const restoreCursorInLastOffset = true

      selectSuggestion(suggestion)
      editable.value.restoreCursorPosition(restoreCursorInLastOffset)
    } else if (currentStep.value === 'logicOperator') {
      // If we're at the logic operator step and user presses Enter,
      // select AND automatically
      const restoreCursorInLastOffset = true
      selectSuggestion({ label: 'AND' })
      editable.value.restoreCursorPosition(restoreCursorInLastOffset)
    } else {
      executeQuery()
    }
  }

  const executeQuery = () => {
    const filter = AzionQueryLanguage.parse(query.value, suggestionsData.value, domains.value)
    props.searchAdvancedFilter(filter)
    emit('dirty', false)
  }

  const getParsedFilters = () => {
    return AzionQueryLanguage.parse(query.value, suggestionsData.value, domains.value)
  }

  const markAsApplied = () => {
    persistHistoryEntry()
    emit('dirty', false)
  }

  /**
   * Build a human-readable query string from `filterAdvanced` and persist it
   * to the shared Recent Queries history. The `dataset` prop is used as a badge
   * so users can distinguish Metrics queries from Events queries side-by-side.
   */
  const persistHistoryEntry = () => {
    const fields = props.filterAdvanced || []
    if (!fields.length) return

    const queryStr = fields
      .map((filterField) => {
        const fieldLabel = filterField.field || filterField.valueField
        const operatorLabel = OPERATOR_MAPPING[filterField.operator]?.label || filterField.operator
        return `${fieldLabel} ${operatorLabel} ${filterField.value}`
      })
      .join(' AND ')

    addQueryToHistory(queryStr, props.dataset || '', fields)
  }

  const handleSearch = () => {
    executeQuery()
  }

  const loadFromHistory = (entry) => {
    if (entry.filterFields?.length) {
      props.searchAdvancedFilter(entry.filterFields)
    } else if (entry.query) {
      query.value = entry.query
      executeQuery()
    }
    showSuggestionsFocusInput.value = false
  }

  const getAqlHistoryParts = (entry) => {
    if (entry.filterFields?.length) {
      return entry.filterFields.map((filterField) => ({
        field: filterField.field || filterField.valueField,
        operator: OPERATOR_MAPPING[filterField.operator]?.label || filterField.operator,
        value: String(filterField.value)
      }))
    }
    const operatorKeys = Object.keys(OPERATOR_MAPPING)
    const segments = (entry.query || '').split(' AND ')
    return segments.map((seg) => {
      const trimmed = seg.trim()
      for (const key of operatorKeys) {
        const idx = trimmed.indexOf(` ${key} `)
        if (idx !== -1) {
          return {
            field: trimmed.substring(0, idx),
            operator: OPERATOR_MAPPING[key].label,
            value: trimmed.substring(idx + key.length + 2)
          }
        }
      }
      return { field: trimmed, operator: '', value: '' }
    })
  }

  const changeCurrentStep = (step) => {
    currentStep.value = step
  }

  const onSelectSuggestionWithTab = (event) => {
    if (filteredSuggestions.value.length === 1) {
      const restoreCursorInLastOffset = true
      event.preventDefault()
      selectSuggestion(filteredSuggestions.value[0])
      editable.value.restoreCursorPosition(restoreCursorInLastOffset)
    }
  }

  const handleErrorsQuery = computed(() =>
    AzionQueryLanguage.queryValidator(query.value, suggestionsData.value)
  )

  watch(handleErrorsQuery, (errors) => {
    emit('validation', Boolean(errors?.length))
  })

  const handleInitialQuery = () => {
    query.value = AzionQueryLanguage.handleInicialQuery(props.filterAdvanced, props.fieldsInFilter)
  }

  const suppressDirtyEmit = ref(false)

  watch(
    () => [props.fieldsInFilter, props.filterAdvanced],
    () => {
      suppressDirtyEmit.value = true
      handleInitialQuery()
      nextTick(() => {
        suppressDirtyEmit.value = false
      })
    },
    { deep: true }
  )

  watch(
    query,
    () => {
      if (suppressDirtyEmit.value) return
      emit('dirty', true)
    },
    { flush: 'post' }
  )

  defineExpose({
    getParsedFilters,
    markAsApplied
  })

  onClickOutside(ignoreClickOutside, () => (showSuggestionsFocusInput.value = false))
</script>

<style scoped>
  .aql-dropdown-panel {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--overlay-content-bg);
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    max-height: 400px;
    overflow-y: auto;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.8125rem;
  }

  /* Force Listbox inside the panel to inherit the panel background */
  .aql-dropdown-panel :deep(.p-listbox) {
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .aql-dropdown-panel :deep(.p-listbox-list) {
    padding: 0.25rem 0;
  }

  .aql-recent-queries {
    border-top: 1px solid var(--surface-border);
  }

  .aql-recent-queries__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }

  .aql-recent-queries__title {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--text-color-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-family: var(--font-family);
  }

  .aql-recent-queries__clear {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-color-secondary);
    padding: 0.25rem;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    font-size: 0.6875rem;
    opacity: 0.5;
    transition: opacity 0.15s;
  }

  .aql-recent-queries__clear:hover {
    opacity: 1;
    color: var(--red-400);
  }

  .aql-recent-queries__list {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0;
    max-height: 200px;
    overflow-y: auto;
  }

  .aql-recent-queries__item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
  }

  .aql-recent-queries__item:hover {
    background: var(--surface-hover);
  }

  .aql-recent-queries__icon {
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
    opacity: 0.4;
  }

  .aql-recent-queries__query {
    flex-shrink: 0;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    color: var(--text-color);
    white-space: nowrap;
  }

  .aql-recent-queries__value {
    flex: 1;
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.8125rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .aql-recent-queries__dataset {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    padding: 2px 6px;
    border-radius: var(--border-radius);
    flex-shrink: 0;
  }

  .aql-recent-queries__remove {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-color-secondary);
    padding: 0.25rem;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    opacity: 0.5;
    transition:
      opacity 0.15s,
      color 0.15s;
    flex-shrink: 0;
  }

  .aql-recent-queries__remove:hover {
    opacity: 1;
    color: var(--red-400);
  }
</style>
