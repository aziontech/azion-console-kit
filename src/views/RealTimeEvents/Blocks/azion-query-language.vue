<template>
  <div
    class="w-full"
    ref="ignoreClickOutside"
  >
    <div class="relative">
      <div class="flex gap-2 items-center justify-center">
        <ContentEditable
          v-model="query"
          @focus="showSuggestionsFocusInput = true"
          @keydown.tab="onSelectSuggestionWithTab"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="confirmSelection"
          :handleQuery="handleQuery"
          ref="editable"
          data-testid="azion-query-language-input"
        />
        <div class="h-auto w-full md:max-w-fit">
          <PrimeButton
            label="Search"
            size="small"
            class="h-auto w-full md:max-w-fit"
            @click="executeQuery"
            :disabled="handleErrorsQuery.length"
            data-testid="azion-query-language-search"
          />
        </div>
      </div>
      <div class="flex flex-col mt-2 gap-1">
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
      class="w-full md:w-14rem max-h-60 overflow-y-auto absolute z-10 max-w-xs py-2"
      @update:modelValue="selectSuggestion"
      v-if="filteredSuggestions.length && showSuggestionsFocusInput"
      data-testid="azion-query-language-suggestions"
      :pt="{ list: { 'data-testid': 'azion-query-language-suggestions-list' } }"
    >
      <template #option="slotProps">
        <div
          class="w-full rounded-md font-mono"
          :data-testid="`azion-query-language-list-item${slotProps.index}`"
          :class="[
            'p-2 cursor-pointer',
            { 'bg-orange-base text-white': slotProps.index === highlightedIndex }
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
  import PrimeButton from 'primevue/button'
  import Listbox from 'primevue/listbox'
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
  const domains = ref({})

  const showSuggestionsFocusInput = ref(false)
  const ignoreClickOutside = ref('ignoreClickOutside')

  const editable = ref(null)

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

  const handleQuery = () => {
    const handleInputMaching = AzionQueryLanguage.handleInputMatching(
      query.value,
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
    if (suggestion) {
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

  const handleInitialQuery = () => {
    query.value = AzionQueryLanguage.handleInicialQuery(props.filterAdvanced, props.fieldsInFilter)
  }

  watch(
    () => props.fieldsInFilter,
    () => {
      handleInitialQuery()
    },
    { deep: true }
  )

  onClickOutside(ignoreClickOutside, () => (showSuggestionsFocusInput.value = false))
</script>
