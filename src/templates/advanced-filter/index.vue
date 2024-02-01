<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { computed, ref, watch } from 'vue'
  import dialogFilter from './dialog-filter.vue'
  import Chip from 'primevue/chip'
  import PrimeButton from 'primevue/button'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { OPERATOR_MAPPING } from './component'

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

  const refDialogFilter = ref()

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
    emit('applyFilter', adaptFilter)
    emit('update:filterAdvanced', adaptFilter)
    updateHash(adaptFilter, props.externalFilter)
  }

  const updateFilter = (value) => {
    setFilter(value)
  }

  const adapterApply = (displayFilter) => {
    return displayFilter?.map(({ valueField, operator, value }) => {
      return { valueField, operator, value }
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
    const { filters } = route.query
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

  const loadFilter = () => {
    if (props.disabled) return
    const { external = {}, filter = [] } = getFilterInHash()

    if (Object.keys(external).length) {
      emit('update:externalFilter', external)
    }

    if (!filter.length) return

    updateDisplayFilter(filter)
    searchFilter()
    updateHash(displayFilter.value, external)
  }

  loadFilter()

  const unwatch = watch(
    () => props.disabled,
    (value) => {
      if (!value) {
        loadFilter()
        unwatch()
      }
    }
  )

  watch(props.fieldsInFilter, () => {
    updateDisplayFilter(displayFilter.value)
  })
</script>
<template>
  <div class="flex max-sm:gap-2 w-full max-sm:align-items-center max-sm:flex-col h-11">
    <div class="p-inputgroup flex flex-row w-full align-items-stretch md:contents">
      <dialogFilter
        :disabled="props.disabled"
        ref="refDialogFilter"
        :filtersOptions="listField"
        :counter="displayFilter.length"
        @applyFilter="updateFilter"
      />
      <div
        class="p-inputgroup-addon p-inputnumber-button flex justify-start w-full gap-2 overflow-auto"
      >
        <ul class="flex gap-3 align-items-center">
          <template
            v-for="(itemFilter, index) in displayFilter"
            :key="itemFilter"
          >
            <li v-if="!DEFAULT_FORMAT.includes(itemFilter.operator)">
              <Chip
                class="text-sm px-2 cursor-pointer"
                removable
                @click="clickFilter(itemFilter, $event)"
                @remove="removeItemFilter(index, $event)"
              >
                <span class="p-chip-text"> {{ itemFilter.field }}</span>
                <span class="font-bold p-chip-text leading-5 pl-1">
                  {{ `${itemFilter.format} ${itemFilter.value}` }}</span
                >
              </Chip>
            </li>
            <li v-if="itemFilter.operator === FORMAT_RANGE">
              <Chip
                class="text-sm px-2 cursor-pointer"
                removable
                @click="clickFilter(itemFilter, $event)"
                @remove="removeItemFilter(index, $event)"
              >
                <span class="font-bold p-chip-text leading-5 pl-1">
                  {{ `${itemFilter.value.begin} ${itemFilter.format}` }}</span
                >
                <span class="p-chip-text"> {{ itemFilter.field }}</span>
                <span class="font-bold p-chip-text leading-5 pl-1">
                  {{ `${itemFilter.value.end} ${itemFilter.format}` }}</span
                >
              </Chip>
            </li>
            <li
              v-if="itemFilter.operator === FORMAT_IN"
              class="flex gap-3 align-items-center"
            >
              <Chip
                class="text-sm px-2"
                :label="itemFilter.field"
              />
              <span> in </span>
              <span> ( </span>
              <template
                v-for="(item, idx) in itemFilter.value"
                :key="item"
              >
                <Chip
                  class="text-sm px-2 cursor-pointer"
                  @click="clickFilter(itemFilter, $event)"
                  @remove="removeValueItemFilter(index, idx, $event)"
                  removable
                >
                  <span class="font-bold p-chip-text leading-5">
                    {{ item.name ? item.name : item }}
                  </span>
                </Chip>
                <span v-if="itemFilter.value.length > idx + 1"> or </span>
                <span v-if="itemFilter.value.length === idx + 1"> ) </span>
              </template>
            </li>
            <li v-if="displayFilter.length > index + 1">and</li>
          </template>
        </ul>
      </div>
    </div>

    <slot
      name="applyButton"
      :filter="displayFilter"
    >
      <PrimeButton
        class="max-sm:w-full min-w-max max-sm:flex-col md:ml-3"
        size="small"
        :disabled="props.disabled || !displayFilter.length"
        @click="searchFilter"
        label="Search"
      />
    </slot>
  </div>
</template>
