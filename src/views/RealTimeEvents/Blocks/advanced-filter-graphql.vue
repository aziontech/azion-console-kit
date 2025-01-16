<!-- JQLFilter.vue -->
<template>
  <div class="relative w-full max-w-lg mx-auto">
    <Card>
      <template #content>
        <div class="flex gap-4">
          <div class="p-inputgroup">
            <InputText
              v-model="editorContent"
              class="w-full"
              @input="handleInput"
              @focus="handleInput"
              @keydown="handleKeyDown"
              @click="handleInput"
              placeholder="Digite sua consulta GraphQL..."
              ref="searchInputRef"
            />
          </div>
          <div class="h-auto w-full md:max-w-fit">
            <PrimeButton
              :disabled="disabledSearch"
              @click="searchFilter"
              label="Search"
              size="small"
              class="h-auto w-full md:max-w-fit"
              data-testid="search-filter-search-button"
            />
          </div>
        </div>

        <OverlayPanel
          ref="suggestionPanel"
          :showCloseIcon="false"
          class="w-fit h-fit max-h-96 overflow-y-auto"
        >
          <div
            v-if="showSuggestions && !loading"
            class="suggestions"
          >
            <div
              v-for="(suggestion, index) in filteredSuggestions"
              :key="index"
              class="p-2 transition-colors duration-200 hover:bg-gray-50 hover:text-black cursor-pointer rounded-lg"
              :class="{ 'bg-gray-50 text-black': selectedIndex === index }"
              @click="selectSuggestion(index)"
            >
              <div class="flex items-center gap-2">
                <i
                  :class="getSuggestionIcon(suggestion.type)"
                  class="mr-2"
                  v-if="!suggestion?.iconMap"
                ></i>
                <p v-if="suggestion?.iconMap && suggestion.iconMap !== 'In'">
                  {{ OPERATOR_MAPPING[suggestion?.iconMap].format }}
                </p>
                <p>
                  {{ suggestion.display }}
                  <span v-if="suggestion.disabled"> - disable</span>
                </p>
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="flex flex-col items-center gap-2"
          >
            <i class="pi pi-spinner spinner text-xl"></i>
            <span>...loading</span>
          </div>
        </OverlayPanel>

        <!-- Exibir filtros salvos -->
        <div class="mt-3">
          <div
            v-for="(filter, index) in savedFilters"
            :key="filter"
            class="mb-2"
          >
            <ChipsDefaultDisplay
              :itemFilter="filter"
              :position="index"
              :removeItemFilter="removeFilterList"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
  import { ref, reactive, computed, watch } from 'vue'
  import Card from 'primevue/card'
  import InputText from 'primevue/inputtext'
  import OverlayPanel from 'primevue/overlaypanel'
  import PrimeButton from 'primevue/button'
  import { OPERATOR_MAPPING } from '@/templates/advanced-filter/component/index'
  import ChipsDefaultDisplay from './components/chips-default-display.vue'

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    searchAdvancedFilter: {
      type: Function,
      required: true
    }
  })

  const options = computed(() => {
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
                  const { value: valueLabel, label: labelOp, format } = OPERATOR_MAPPING[valueOp]
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
  const loading = ref(false)

  // Estados
  const editorContent = ref('')
  const currentWord = ref('')
  const selectedIndex = ref(-1)
  const showSuggestions = ref(false)
  const suggestionPanel = ref(null)
  const filteredSuggestions = ref([])
  const currentFilter = reactive({
    field: '',
    operator: '',
    value: '',
    step: 'field',
    domain: false,
    isBetween: false,
    secondValue: '',
    operatorMapping: ''
  })
  const savedFilters = ref([])
  const searchInputRef = ref(null)

  const handleInput = (event) => {
    const text = event.target.value
    const words = text.split(' ')
    currentWord.value = words[words.length - 1].toLowerCase()

    if (currentFilter.isBetween && editorContent.value.endsWith(' ')) {
      const hasAnd = editorContent.value.indexOf('and')
      if (hasAnd !== -1) {
        hideSuggestions()
        return
      }
      currentFilter.step = 'between'
      currentFilter.value = getValueIputedOnFilter()
      last.value = 4
      updateSuggestions()
      return
    }
    updateSuggestions()
  }

  const updateSuggestions = async () => {
    let suggestions = []
    switch (currentFilter.step) {
      case 'field':
        if (!currentFilter.field) {
          suggestions = options.value
            .filter((item) => item.value.label.toLowerCase().includes(currentWord.value))
            .map((item) => ({
              display: item.value.label,
              value: item.value.label,
              type: 'field',
              disabled: false
            }))
        }
        break

      case 'operator':
        const field = options.value.find((item) => item.value.label === currentFilter.field)
        if (field) {
          suggestions = field.value.operator
            .filter((op) => op.label.includes(currentWord.value))
            .map((op) => ({
              display: op.label,
              value: op.value.format,
              type: op.value.type,
              iconMap: op.value.value,
              operatorMapping: op.value.value,
              disabled: savedFilters.value.some(
                (filter) =>
                  filter.format === op.value.format &&
                  filter.field === field.value.label &&
                  op.value.format !== 'in'
              ),
              props: op.value.props
            }))
        }
        break

      case 'value':
        const currentField = options.value.find((item) => item.value.label === currentFilter.field)
        if (currentField.label === 'Domain') {
          suggestions = await getDomains(currentField.value.operator[0].value.props.services)
        } else {
          hideSuggestions()
        }
        break
      case 'between':
        const hasAnd = editorContent.value.indexOf('and')
        if (hasAnd !== -1) return
        suggestions = [
          {
            display: 'And',
            value: 'and',
            type: 'and',
            disabled: false
          }
        ]
        break
    }

    filteredSuggestions.value = suggestions
    showSuggestions.value = suggestions.length > 0
    showSuggestionsPanel()
  }

  const getDomains = async (service) => {
    try {
      loading.value = true
      const resp = await service()
      return resp.map((item) => ({
        display: item.label,
        value: item.value,
        domain: true
      }))
    } catch (error) {
      return []
    } finally {
      loading.value = false
    }
  }

  const selectSuggestion = (index) => {
    const suggestion = filteredSuggestions.value[index]
    if (!suggestion && currentFilter.step !== 'value') return
    if (suggestion?.disabled && currentFilter.step !== 'value') return

    switch (currentFilter.step) {
      case 'field':
        currentFilter.field = suggestion.value
        currentFilter.step = 'operator'
        last.value = 2
        break
      case 'operator':
        currentFilter.operator = suggestion.value
        currentFilter.step = 'value'
        currentFilter.operatorMapping = suggestion.operatorMapping
        last.value = 3
        currentFilter.isBetween = suggestion.display === 'Between'
        break
      case 'value':
        if (suggestion?.domain) {
          currentFilter.value = {
            label: suggestion.display,
            value: suggestion.value
          }
          currentFilter.domain = true
          hideSuggestions()
          saveCurrentFilter()
          return
        } else if (currentFilter.isBetween) {
          currentFilter.value = getValueIputedOnFilter()
          currentFilter.step = 'between'
          last.value = 4
        }
        break
      case 'between':
        editorContent.value += ' And'
        hideSuggestions()
        break
    }

    // Atualizar o conteúdo do editor
    updateEditorContent()
    updateSuggestions()

    // if (currentFilter.step === 'value') hideSuggestions()
  }

  const getValueIputedOnFilter = () => {
    const wordCount = editorContent.value.split(' ').filter((item) => item !== '').length
    return editorContent.value.split(' ')[wordCount - 1]
  }

  const updateEditorContent = () => {
    let content = currentFilter.field
    if (currentFilter.operator) {
      content += ' ' + currentFilter.operator
    }
    if (currentFilter.value) {
      content += ' ' + currentFilter.value
    }
    editorContent.value = content + ' '
  }

  const handleKeyDown = (event) => {
    if (showSuggestions.value) {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          moveSelection(1)
          break
        case 'ArrowUp':
          event.preventDefault()
          moveSelection(-1)
          break
        case 'Enter':
          event.preventDefault()
          if (currentFilter.step === 'value') {
            if (currentFilter.field === 'Domain') {
              selectSuggestion(selectedIndex.value)
              hideSuggestions()
            }
          } else if (currentFilter.step === 'between') {
            editorContent.value += ' and'
            hideSuggestions()
          } else if (selectedIndex.value >= 0) {
            selectSuggestion(selectedIndex.value)
          }
          break
        case 'Escape':
          hideSuggestions()
          break
      }
    } else if (
      event.key === 'Enter' &&
      currentFilter.step === 'value' &&
      !currentFilter.isBetween
    ) {
      event.preventDefault()
      saveCurrentFilter()
    } else if (event.key === 'Enter' && currentFilter.isBetween) {
      const hasAnd = editorContent.value.indexOf('and')
      if (hasAnd === -1) {
        selectSuggestion(selectedIndex.value)
        updateSuggestions()
      } else {
        const secondValue = editorContent.value.split('and')[1]?.trim()
        currentFilter.secondValue = secondValue

        if (currentFilter.secondValue) saveCurrentFilter()
      }
    }
  }

  const handleFilter = (operator) => {
    if (operator.label === 'Between') {
      return Object.assign({
        begin: parseInt(currentFilter.value),
        end: parseInt(currentFilter.secondValue)
      })
    } else {
      return operator.value.type === 'Int' ? parseInt(currentFilter.value) : currentFilter.value
    }
  }

  const saveCurrentFilter = () => {
    if (currentFilter.field && currentFilter.operator && editorContent.value.trim()) {
      if (currentFilter.step === 'value' && !currentFilter?.domain) {
        const wordCount = editorContent.value.split(' ').length
        currentFilter.value = editorContent.value.split(' ')[wordCount - 1]
      }

      const field = options.value.find((item) => item.value.label === currentFilter.field)
      const operator = field.value.operator.find(
        (item) => item.value.value === currentFilter.operatorMapping
      )

      savedFilters.value.push({
        field: currentFilter.field,
        format: currentFilter.operator,
        value: handleFilter(operator),

        operator: operator.value.value,
        valueField: field.value.value,
        type: operator.value.type
      })

      // Resetar o estado atual
      Object.assign(currentFilter, {
        field: '',
        operator: '',
        value: '',
        step: 'field',
        domain: false
      })
      editorContent.value = ''
    }
  }

  const showSuggestionsPanel = () => {
    if (suggestionPanel.value && filteredSuggestions.value.length > 0) {
      suggestionPanel.value.show({
        target: searchInputRef.value.$el,
        currentTarget: searchInputRef.value.$el,
        preventDefault: () => {}
      })
    }
  }

  const hideSuggestions = () => {
    if (suggestionPanel.value) {
      suggestionPanel.value.hide()
    }
    showSuggestions.value = false
    selectedIndex.value = -1
  }

  const moveSelection = (direction) => {
    const length = filteredSuggestions.value.length
    if (length === 0) return

    selectedIndex.value += direction
    if (selectedIndex.value >= length) selectedIndex.value = 0
    if (selectedIndex.value < 0) selectedIndex.value = length - 1
  }

  const getSuggestionIcon = (type) => {
    return type === 'field' ? 'pi pi-table' : 'pi pi-code'
  }

  const removeFilterList = (idx) => {
    savedFilters.value = savedFilters.value.filter((item, index) => index !== idx)
  }

  const searchFilter = () => {
    const searchParams = savedFilters.value.reduce((acc, filter) => {
      if (filter.type !== 'ArrayObjectDomain') {
        // eslint-disable-next-line no-unused-vars
        const { field, format, ...filterRest } = filter
        acc.push(filterRest)
        return acc
      }

      const existingFilter = acc.find(
        (item) => item.type === 'ArrayObjectDomain' && item.valueField === filter.valueField
      )

      if (existingFilter) {
        existingFilter.value = Array.isArray(existingFilter.value)
          ? [...existingFilter.value, filter.value]
          : [existingFilter.value.toString(), filter.value]
      } else {
        // console.log(filter)
        acc.push({
          operator: filter.operator,
          type: filter.type,
          value: [filter.value],
          valueField: filter.valueField
        })
      }

      return acc
    }, [])

    props.searchAdvancedFilter(searchParams)
  }

  const resetStepFilter = (step = 'field') => {
    Object.assign(currentFilter, {
      field: step === 'field' ? '' : currentFilter.field,
      operator: step === 'operator' ? '' : currentFilter.operator,
      value: '',
      step
    })
  }

  const resetAllFilter = () => {
    Object.assign(currentFilter, {
      field: '',
      operator: '',
      value: '',
      step: 'field'
    })
    last.value = 1
    updateSuggestions()
    showSuggestionsPanel()
  }

  const last = ref(1)

  watch(editorContent, (str) => {
    const values = str.split(' ')
    const hasSpace = str.endsWith(' ')
    const hasSpaceField = currentFilter.field.split(' ').length

    const wordCount = values.filter((value) => value !== '').length + (hasSpace ? 1 : 0)
    if (wordCount < last.value) {
      if (wordCount === 1 || wordCount === hasSpaceField) {
        resetStepFilter('field')
      } else if (wordCount === hasSpaceField + 1) {
        resetStepFilter('operator')
      } else if (wordCount === 0) {
        resetAllFilter()
        return
      }
    }

    last.value = wordCount
  })
</script>

<style scoped>
  :deep(.p-overlaypanel) {
    width: 100%;
  }

  :deep(.p-overlaypanel-content) {
    padding: 0;
  }

  .spinner {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
