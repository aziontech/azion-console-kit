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
            v-if="showSuggestions"
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
                <p v-else>{{ OPERATOR_MAPPING[suggestion?.iconMap].format }}</p>
                <p>
                  {{ suggestion.display }}
                  <span v-if="suggestion.disabled"> - disable</span>
                </p>
              </div>
            </div>
          </div>
        </OverlayPanel>

        <!-- Exibir filtros salvos -->
        <div class="mt-3">
          <div
            v-for="(filter, index) in savedFilters"
            :key="index"
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
    step: 'field' // 'field' | 'operator' | 'value'
  })
  const savedFilters = ref([])
  const searchInputRef = ref(null)

  // Métodos
  const handleInput = (event) => {
    const text = event.target.value
    const words = text.split(' ')
    currentWord.value = words[words.length - 1].toLowerCase()

    updateSuggestions()
    showSuggestionsPanel(event)
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
              disabled: savedFilters.value.some(
                (filter) => filter.format === op.value.format && filter.field === field.value.label
              ),
              props: op.value.props
            }))
        }
        break

      case 'value':
        // Para o valor, não mostraremos sugestões
        break
    }

    filteredSuggestions.value = suggestions
    showSuggestions.value = suggestions.length > 0
  }

  const selectSuggestion = (index) => {
    const suggestion = filteredSuggestions.value[index]
    if (!suggestion) return
    if (suggestion.disabled) return

    switch (currentFilter.step) {
      case 'field':
        currentFilter.field = suggestion.value
        currentFilter.step = 'operator'
        last.value = 2
        break
      case 'operator':
        currentFilter.operator = suggestion.value
        currentFilter.step = 'value'
        last.value = 3
        break
      case 'value':
        break
    }

    // Atualizar o conteúdo do editor
    updateEditorContent()
    updateSuggestions()

    if (currentFilter.step === 'value') hideSuggestions()
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
            saveCurrentFilter()
          } else if (selectedIndex.value >= 0) {
            selectSuggestion(selectedIndex.value)
          }
          break
        case 'Escape':
          hideSuggestions()
          break
      }
    } else if (event.key === 'Enter' && currentFilter.step === 'value') {
      event.preventDefault()
      saveCurrentFilter()
    }
  }

  const saveCurrentFilter = () => {
    if (currentFilter.field && currentFilter.operator && editorContent.value.trim()) {
      if (currentFilter.step === 'value') {
        const wordCount = editorContent.value.split(' ').length
        currentFilter.value = editorContent.value.split(' ')[wordCount - 1]
      } else {
        currentFilter.value = editorContent.value.trim()
      }

      const field = options.value.find((item) => item.value.label === currentFilter.field)
      const operator = field.value.operator.find(
        (item) => item.value.format === currentFilter.operator
      )

      savedFilters.value.push({
        field: currentFilter.field,
        format: currentFilter.operator,
        value: operator.value.type === 'Int' ? parseInt(currentFilter.value) : currentFilter.value,

        operator: operator.value.value,
        valueField: field.value.value,
        type: operator.value.type
      })

      // Resetar o estado atual
      Object.assign(currentFilter, {
        field: '',
        operator: '',
        value: '',
        step: 'field'
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

  const removeFilterList = (index) => {
    savedFilters.value.splice(index, 1)
  }

  const searchFilter = () => {
    const searchParams = savedFilters.value.map((filter) => ({
      operator: filter.operator,
      type: filter.type,
      value: filter.value,
      valueField: filter.valueField
    }))

    props.searchAdvancedFilter(searchParams)
  }

  const resetStepFilter = (step = 'field') => {
    Object.assign(currentFilter, {
      field: step === 'field' ? '' : currentFilter.field,
      operator: step === 'operator' ? '' : currentFilter.operator,
      value: '',
      step: step
    })
    updateSuggestions()
    showSuggestionsPanel()
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
      if (wordCount === 1 || wordCount === hasSpaceField || hasSpaceField === 1) {
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
</style>
