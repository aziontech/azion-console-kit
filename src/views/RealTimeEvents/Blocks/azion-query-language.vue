<template>
  <div
    class="w-full"
    ref="ignoreClickOutside"
  >
    <div class="relative">
      <div class="flex gap-2 items-center justify-center">
        <InputText
          v-model="queryText"
          @keydown.down.prevent="highlightNext"
          @keydown.up.prevent="highlightPrev"
          @keydown.enter.prevent="confirmSelection"
          @keydown.tab.prevent="onSelectSuggestionWithTab"
          @input="handleInput"
          placeholder="Azion Query Language"
          @focus="showSuggestionsFocusInput = true"
          class="w-full"
          ref="ignoreClickOutside"
        />
        <div class="h-auto w-full md:max-w-fit">
          <PrimeButton
            label="Search"
            size="small"
            class="h-auto w-full md:max-w-fit"
            @click="executeQuery"
            :disabled="formattedQuery.length !== 0"
          />
        </div>
      </div>
      <div class="flex flex-col mt-2 gap-1">
        <small
          v-if="formattedQuery.includes('quote-error')"
          class="p-error text-xs font-normal leading-tight"
        >
          Atenção: os campos compostos devem ser incluídos entre aspas. Exemplo: "Upstream Status".
        </small>
        <small
          v-if="formattedQuery.includes('not-exists-field-error')"
          class="p-error text-xs font-normal leading-tight"
        >
          Atenção: alguns campos fornecidos não correspondem aos disponíveis atualmente. Por favor,
          verifique e tente novamente.
        </small>
        <small
          v-if="formattedQuery.includes('in-operator-parentheses-error')"
          class="p-error text-xs font-normal leading-tight"
        >
          Atenção: existe campos com operador in que precisam está dentro de parênteses. Por favor,
          verifique e tente novamente. ex: domain in (domain1, domain2)
        </small>
        <small
          v-if="formattedQuery.includes('in-operator-trailing-comma-error')"
          class="p-error text-xs font-normal leading-tight"
        >
          Atenção: campos com operador in que precisa ser removido a virgula no final dos valores em
          pareênteses. Por favor, verifique e tente novamente.
        </small>
      </div>
    </div>

    <Listbox
      :options="filteredSuggestions"
      ref="listboxRef"
      optionLabel="label"
      class="w-full md:w-14rem max-h-60 overflow-y-auto absolute z-10 max-w-2xl"
      @update:modelValue="selectSuggestion"
      v-if="filteredSuggestions.length && showSuggestionsFocusInput"
    >
      <template #option="slotProps">
        <div
          class="w-full rounded-md"
          :class="[
            'p-2 cursor-pointer',
            { 'bg-blue-500 text-white': slotProps.index === highlightedIndex }
          ]"
        >
          {{ slotProps.option.label }}
        </div>
      </template>
      <template
        #loader
        v-if="loading"
      >
        loading....
      </template>
    </Listbox>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, nextTick } from 'vue'
  import PrimeButton from 'primevue/button'
  import InputText from 'primevue/inputtext'
  import Listbox from 'primevue/listbox'
  import Aql from './azion-query-language.js'
  import { OPERATOR_MAPPING_ADVANCED_FILTER } from '@/templates/advanced-filter/component/index'
  import { onClickOutside } from '@vueuse/core'
  import { listWorkloadsService } from '@/services/workloads-services/list-workloads-service.js'

  const AzionQueryLanguage = new Aql()

  const queryText = ref('')
  const currentStep = ref('field')
  const highlightedIndex = ref(0)
  const listboxRef = ref(null)
  const domains = ref({})
  const loading = ref(false)

  const showSuggestionsFocusInput = ref(false)
  const ignoreClickOutside = ref('ignoreClickOutside')

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
    await loaderDomainWorkloads()
  })

  const suggestionsData = computed(() => {
    return (
      props.fieldsInFilter
        // .filter((item) => !item.label.includes('Domain'))
        .map(({ label, value, description, operator, disabled, mostRelevant = 0 }) => {
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
        })
    )
  })

  const currentFieldToken = computed(() => {
    const parts = queryText.value.split(/\s+and\s+/i)
    return parts.pop().trim().replace(/["']/g, '')
  })

  const filteredSuggestions = computed(() => {
    if (currentStep.value === 'field') {
      const searchTerm = currentFieldToken.value.toLowerCase()

      if (!searchTerm) {
        return suggestionsData.value
      } else {
        return suggestionsData.value.filter((item) =>
          item.label.toLowerCase().startsWith(searchTerm)
        )
      }
    } else if (currentStep.value === 'operator') {
      const selectedField = suggestionsData.value.find(
        (item) => item.value.label.toLowerCase() === selectedFieldName.value.toLowerCase()
      )

      if (!selectedField) return []

      return selectedField.value.operator.map((op) => ({
        label: op.value.format
      }))
    } else if (currentStep.value === 'value') {
      if (selectedFieldName.value === 'domain') {
        return domains.value
      }
      return []
    } else if (currentStep.value === 'logicOperator') {
      return [{ label: 'AND' }]
    }
    return []
  })

  const loaderDomainWorkloads = async () => {
    try {
      const response = await listWorkloadsService({ fields: 'id,name' })
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

  const selectedFieldName = ref('')

  const handleInput = () => {
    const handleInputMaching = AzionQueryLanguage.handleInputMatching(
      queryText.value,
      suggestionsData.value
    )
    changeCurrentStep(handleInputMaching.operator)
    selectedFieldName.value = handleInputMaching.selectedField
  }

  const selectSuggestion = (suggestion) => {
    const data = AzionQueryLanguage.selectSuggestion(
      suggestion,
      queryText.value,
      currentStep.value,
      selectedFieldName.value
    )
    queryText.value = data?.query
    selectedFieldName.value = data?.label
    changeCurrentStep(data?.nextStep)
    highlightedIndex.value = 0
  }

  const scrollToHighlighted = () => {
    nextTick(() => {
      const container = listboxRef.value?.$el || listboxRef.value
      if (container) {
        const highlightedItem = container.querySelector('.bg-blue-500')
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
      selectSuggestion(suggestion)
    } else {
      executeQuery()
    }
  }

  const executeQuery = () => {
    const filter = AzionQueryLanguage.parse(queryText.value, suggestionsData.value, domains.value)
    props.searchAdvancedFilter(filter)
  }

  const changeCurrentStep = (step) => {
    currentStep.value = step
  }

  const onSelectSuggestionWithTab = () => {
    if (filteredSuggestions.value.length === 1) {
      selectSuggestion(filteredSuggestions.value[0])
    }
  }

  const formattedQuery = computed(() => {
    let erros = AzionQueryLanguage.queryValidator(queryText.value, suggestionsData.value)

    return erros
  })

  onClickOutside(ignoreClickOutside, () => (showSuggestionsFocusInput.value = false))
</script>
