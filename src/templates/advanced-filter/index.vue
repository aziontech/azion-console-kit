<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { ref } from 'vue'
  import dialogFilter from './dialog-filter.vue'
  import Chip from 'primevue/chip'
  import PrimeButton from 'primevue/button'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { OPERATOR_MAPPING } from './component'

  const route = useRoute()
  const toast = useToast()
  const router = useRouter()
  const emit = defineEmits(['applyFilter'])

  const props = defineProps({
    fieldsInFilter: {
      type: Array,
      required: true
    }
  })

  const defaultFields = ref(JSON.parse(JSON.stringify(props.fieldsInFilter)))
  const fields = ref(props.fieldsInFilter)
  const displayFilter = ref([])
  const refDialogFilter = ref()
  const FORMAT_IN = 'In'
  const FORMAT_RANGE = 'Range'
  const DEFAULT_FORMAT = [FORMAT_IN, FORMAT_RANGE]

  const adapterApply = () => {
    return displayFilter.value?.map(({ valueField, operator, value }) => {
      return { valueField, operator, value }
    })
  }

  const encodeFilter = (value) => {
    const stringifiedFilters = JSON.stringify(value)
    return btoa(stringifiedFilters)
  }

  const decodeFilter = (filters) => {
    if (!filters) return []
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

  const setFilter = (value) => {
    if (value.edit) {
      displayFilter.value.forEach((item, index) => {
        if (item.field === value.field && item.operator === value.operator) {
          displayFilter.value[index] = { ...value }
          return
        }
      })
      return
    }
    displayFilter.value.push({ ...value })
  }

  const updateFilter = (value) => {
    setFilter(value)
    updateDisabledField()
  }

  const updateDisabledField = () => {
    defaultFields.value.map((itemField, indexField) => {
      itemField.operator.map((operator, indexOperator) => {
        fields.value[indexField].operator[indexOperator].disabled = operator.disabled
      })
      fields.value[indexField].disabled = fields.value[indexField].operator.every(
        (operator) => operator.disabled
      )
    })

    if (!displayFilter.value.length) return

    displayFilter.value?.map((itemInList) => {
      fields.value.map((itemField, indexField) => {
        if (itemInList.valueField === itemField.value) {
          itemField.operator.map((operator, indexOperator) => {
            if (itemInList.operator === operator.value) {
              fields.value[indexField].operator[indexOperator].disabled = true
            }
          })
          fields.value[indexField].disabled = fields.value[indexField].operator.every(
            (operator) => operator.disabled
          )
        }
      })
    })
  }

  const clickFilter = (item, event) => {
    event.stopPropagation()
    updateDisabledField()
    refDialogFilter.value.show(item)
  }

  const removeItemFilter = (item, index, event) => {
    refDialogFilter.value.hide(event)
    displayFilter.value.splice(index, 1)
    updateDisabledField()
  }

  const removeValueItemFilter = (item, index, idx, event) => {
    refDialogFilter.value.hide(event)
    item.value.splice(idx, 1)
    if (!item.value.length) {
      displayFilter.value.splice(index, 1)
    }
    updateDisabledField()
  }

  const searchFilter = () => {
    const adaptFilter = adapterApply()
    const query = {
      filters: encodeFilter(adaptFilter)
    }
    const { params } = route
    router.push({ params, query })
    emit('applyFilter', adaptFilter)
  }

  const loadFilter = () => {
    const currentParamValue = route.query?.filters
    if (!currentParamValue) return
    const filter = decodeFilter(currentParamValue)

    filter.forEach((item) => {
      const { label, disabled, operator } = defaultFields.value.find(
        ({ value }) => value === item.valueField
      )
      const disabledOp = operator.find(({ value }) => value === item.operator)?.disabled

      const newItem = {
        ...item,
        field: label,
        format: OPERATOR_MAPPING[item.operator].format
      }
      if (disabled || disabledOp) return
      setFilter(newItem)
    })
    updateDisabledField()
  }

  loadFilter()
</script>
<template>
  <div class="flex gap-2 w-full align-items-center">
    <div class="p-inputgroup flex flex-row w-full align-items-stretch">
      <dialogFilter
        ref="refDialogFilter"
        :listField="fields"
        :counter="displayFilter.length"
        @applyFilter="updateFilter"
      />
      <div class="p-inputgroup-addon flex justify-start w-full gap-2 overflow-auto">
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
                @remove="removeItemFilter(itemFilter, index, $event)"
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
                @remove="removeItemFilter(itemFilter, index, $event)"
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
                  @remove="removeValueItemFilter(itemFilter, index, idx, $event)"
                  removable
                >
                  <span class="font-bold p-chip-text leading-5">
                    {{ item.name ? item.name : item }}</span
                  >
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
        class="max-sm:w-full min-w-max"
        size="small"
        @click="searchFilter"
        label="Search"
      />
    </slot>
  </div>
</template>
