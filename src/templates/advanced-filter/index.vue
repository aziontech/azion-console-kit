<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { computed, onMounted, ref, watch } from 'vue'
  import dialogFilter from './dialog-filter.vue'
  import PrimeButton from 'primevue/button'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { OPERATOR_MAPPING } from './component'
  import chipsDefaultDisplay from './component/display/chips-default-display.vue'
  import chipsRangeDisplay from './component/display/chips-range-display.vue'
  import chipsInDisplay from './component/display/chips-in-display.vue'

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const emit = defineEmits(['applyFilter', 'update:externalFilter', 'update:filterAdvanced'])

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    },
    disabled: {
      type: Boolean
    },
    hashLess: {
      type: Boolean
    },
    filterHash: {
      type: String
    },
    filterAdvanced: {
      type: Object,
      required: false
    },
    externalFilter: {
      type: Object,
      required: false
    }
  })

  const FORMAT_IN = 'In'
  const FORMAT_RANGE = 'Range'
  const DEFAULT_FORMAT = [FORMAT_IN, FORMAT_RANGE]
  const displayFilter = ref([])
  const lastFilter = ref(true)

  const refDialogFilter = ref()

  const disabledSearch = computed(() => {
    return props.disabled || (lastFilter.value && !displayFilter.value.length)
  })

  const listField = computed(() => {
    return props.fieldsInFilter.map((itemField) => {
      const itemDisplay = displayFilter.value.filter((itemFieldDisplay) => {
        return itemField.value === itemFieldDisplay.valueField
      })

      const operator = itemField.operator.map((operator) => {
        const itemOperator = itemDisplay.find((dOperator) => operator.value === dOperator.operator)

        const disabledOperator = operator.disabled || itemOperator?.operator === operator.value
        return { ...operator, disabled: disabledOperator }
      })

      const disabledAllOperator = operator.every((operator) => operator.disabled)
      const disabledField = itemField.disabled || disabledAllOperator

      return {
        ...itemField,
        disabled: disabledField,
        operator
      }
    })
  })

  const clickFilter = (item, event) => {
    event.stopPropagation()
    refDialogFilter.value.show(item)
  }

  const removeItemFilter = (index, event) => {
    refDialogFilter.value.hide(event)
    displayFilter.value.splice(index, 1)
  }

  const removeValueItemFilter = (index, idx, event) => {
    refDialogFilter.value.hide(event)

    displayFilter.value[index].value.splice(idx, 1)
    if (!displayFilter.value[index].value.length) {
      displayFilter.value.splice(index, 1)
    }
  }

  const searchFilter = () => {
    const adaptFilter = adapterApply(displayFilter.value)
    lastFilter.value = !displayFilter.value.length
    emit('applyFilter', adaptFilter)
    emit('update:filterAdvanced', adaptFilter)
    updateHash(adaptFilter, props.externalFilter)
  }

  const updateFilter = (value) => {
    setFilter(value)
  }

  const adapterApply = (displayFilter) => {
    return displayFilter?.map(({ valueField, operator, value, type }) => {
      return { valueField, operator, value, type }
    })
  }

  const encodeFilter = (value) => {
    const stringifiedFilters = JSON.stringify(value)
    return btoa(stringifiedFilters)
  }

  const decodeFilter = (filters) => {
    if (!filters) return {}
    try {
      const decodedFilter = JSON.parse(atob(filters))
      return decodedFilter
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error
      })
      return null
    }
  }

  const getFilterInHash = () => {
    const filters = props.filterHash || route.query.filters

    const decodedFilter = decodeFilter(filters)
    return decodedFilter
  }

  const updateHash = (filter, external) => {
    const { params } = route
    const query = {
      filters: encodeFilter({
        external,
        filter
      })
    }
    router.push({ params, query })
  }

  const setFilter = (value) => {
    if (value.edit) {
      const index = displayFilter.value.findIndex(
        (item) => item.field === value.field && item.operator === value.operator
      )
      displayFilter.value[index] = { ...value }
      return
    }

    displayFilter.value.push({ ...value })
  }

  const updateDisplayFilter = (filterDisplay) => {
    if (!filterDisplay?.length) return

    const newDisplay = filterDisplay.map((item) => {
      const { label, disabled, operator } = props.fieldsInFilter.find(
        ({ value }) => value === item.valueField
      )

      const disabledOp = operator.find(({ value }) => value === item.operator)?.disabled

      if (disabled || disabledOp) return

      return {
        ...item,
        field: label,
        format: OPERATOR_MAPPING[item.operator].format
      }
    })

    displayFilter.value = newDisplay.filter((item) => item)
  }

  const clearDisplayFilter = () => {
    if (!displayFilter.value.length) return
    displayFilter.value = []
    emit('update:filterAdvanced', [])
    updateHash([], props.externalFilter)
  }

  const loadFilter = () => {
    if (props.disabled) return
    const { external = {}, filter = [] } = getFilterInHash()

    if (Object.keys(external).length) {
      emit('update:externalFilter', external)
    }

    if (!filter.length && !props.hashLess) return

    updateDisplayFilter(filter)

    searchFilter()
  }

  const unwatch = watch(
    () => props.disabled,
    (value) => {
      if (!value) {
        loadFilter()
        unwatch()
      }
    }
  )

  watch(
    () => props.fieldsInFilter,
    () => {
      updateDisplayFilter(displayFilter.value)
    }
  )

  watch(
    () => props.externalFilter,
    (value) => {
      const adaptFilter = adapterApply(displayFilter.value)
      updateHash(adaptFilter, value)
    }
  )

  onMounted(() => {
    loadFilter()
  })

  defineExpose({
    clearDisplayFilter
  })
</script>
<template>
  <div class="flex w-full min-w-0 flex-column gap-4 md:gap-2 md:flex-row">
    <dialogFilter
      :disabled="props.disabled"
      ref="refDialogFilter"
      :filtersOptions="listField"
      :counter="displayFilter.length"
      @applyFilter="updateFilter"
    />

    <div
      class="md:-ml-2 md:border-b md:border-left-none md:border-r border-solid border-t flex items-center p-inputtext md:rounded-[0px_6px_6px_0px] w-full overflow-x-auto overflow-y-hidden h-12"
    >
      <ul class="flex gap-3 align-items-center">
        <template
          v-for="(itemFilter, index) in displayFilter"
          :key="itemFilter"
        >
          <li v-if="!DEFAULT_FORMAT.includes(itemFilter.operator)">
            <chipsDefaultDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeItemFilter="removeItemFilter"
            />
          </li>
          <li v-if="itemFilter.operator === FORMAT_RANGE">
            <chipsRangeDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeItemFilter="removeItemFilter"
            />
          </li>
          <li
            v-if="itemFilter.operator === FORMAT_IN"
            class="flex gap-3 align-items-center"
          >
            <chipsInDisplay
              :itemFilter="itemFilter"
              :position="index"
              :clickFilter="clickFilter"
              :removeValueItemFilter="removeValueItemFilter"
            />
          </li>
          <li v-if="displayFilter.length > index + 1">and</li>
        </template>
      </ul>
    </div>

    <PrimeButton
      class="h-auto min-w-max max-sm:bg-red"
      size="small"
      :disabled="disabledSearch"
      @click="searchFilter"
      label="Search"
    />
  </div>
</template>
