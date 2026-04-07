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

    <Listbox
      :options="filteredSuggestions"
      ref="listboxRef"
      optionLabel="label"
      :modelValue="listboxModel"
      class="w-full md:w-14rem max-h-60 overflow-y-auto absolute z-50 max-w-xs py-2 top-full left-0"
      @update:modelValue="onListboxModelUpdate"
      v-if="filteredSuggestions.length && showSuggestionsFocusInput"
      data-testid="azion-query-language-suggestions"
      :pt="{
        root: { class: 'p-0' },
        list: { 'data-testid': 'azion-query-language-suggestions-list' },
        item: { class: 'p-0' }
      }"
    >
      <template #option="slotProps">
        <div
          class="w-full rounded-md font-mono"
          :data-testid="`azion-query-language-list-item${slotProps.index}`"
          @mousedown.prevent.stop="onOptionMouseDown(slotProps.option)"
          :class="[
            'p-2 cursor-pointer ',
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
        return [{ label: 'AND' }]
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
    if (filteredSuggestions.value.length) {
      showSuggestionsFocusInput.value = true
    }
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
    emit('dirty', false)
  }

  const handleSearch = () => {
    executeQuery()
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
