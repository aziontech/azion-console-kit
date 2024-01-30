<script setup>
  defineOptions({ name: 'advanced-filter' })
  import { ref } from 'vue'
  import dialogFilter from './dialog-filter.vue'
  import Chip from 'primevue/chip'
  import PrimeButton from 'primevue/button'

  const emit = defineEmits(['applyFilter'])

  const props = defineProps({
    listField: {
      type: Object,
      required: true
    }
  })

  const fields = ref(props.listField)
  const displayFilter = ref([])
  const refDialogFilter = ref()
  const FORMAT_IN = 'In'
  const FORMAT_RANGE = 'Range'
  const DEFAULT_FORMAT = [FORMAT_IN, FORMAT_RANGE]

  const updateFilter = (value) => {
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
    updateDisabledField()
  }

  const updateDisabledField = () => {
    fields.value.forEach((field) => {
      field.disabled = false
      field.operator.forEach((operator) => {
        operator.disabled = false
      })
    })
    if (!displayFilter.value.length) return
    displayFilter.value?.forEach((itemInList) => {
      fields.value.forEach((field) => {
        if (field.value === itemInList.valueField) {
          field.operator.forEach((operator) => {
            if (operator.value === itemInList.operator) {
              operator.disabled = true
              return
            }
          })
          field.disabled = field.operator.every((operator) => operator.disabled)
        }
      })
    })
  }

  const clickFilter = (item, event) => {
    event.stopPropagation()
    refDialogFilter.value.show(item)
  }

  const removeFilter = (item, index, event) => {
    refDialogFilter.value.hide(event)
    displayFilter.value.splice(index, 1)
    updateDisabledField()
  }

  const removeFilterItem = (item, index, idx, event) => {
    refDialogFilter.value.hide(event)
    item.value.splice(idx, 1)
    if (!item.value.length) {
      displayFilter.value.splice(index, 1)
    }
    updateDisabledField()
  }
</script>
<template>
  <div class="flex gap-2 w-full">
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
                @remove="removeFilter(itemFilter, index, $event)"
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
                @remove="removeFilter(itemFilter, index, $event)"
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
                  @remove="removeFilterItem(itemFilter, index, idx, $event)"
                  removable
                >
                  <span class="p-chip-text"> {{ item.name ? item.name : item }}</span>
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
        class="max-sm:w-full"
        @click="emit('applyFilter', displayFilter)"
        label="Search"
      />
    </slot>
  </div>
</template>
