<script setup>
  import Chip from 'primevue/chip'

  const props = defineProps({
    itemFilter: {
      type: Object,
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    removeItemFilter: {
      type: Function,
      required: true
    }
  })

  const formattedValue = (filter) => {
    let newFilter = { ...filter }
    if (['Boolean', 'StringObject'].includes(filter?.type))
      newFilter = { ...filter, value: filter?.value?.label.toLowerCase() }

    const isEmptyString = !newFilter?.value && newFilter?.type === 'String'
    if (newFilter.operator === 'Range' && newFilter.type === 'IntRange') {
      return `${newFilter.format} ${isEmptyString ? '""' : newFilter.value.begin} and ${
        newFilter.value.end
      }`
    }
    return `${newFilter.format} ${isEmptyString ? '""' : newFilter.value}`
  }
</script>
<template>
  <Chip
    class="text-sm px-2 cursor-pointer w-max"
    removable
    @remove="props.removeItemFilter(props.position, $event)"
  >
    <span class="p-chip-text"> {{ props.itemFilter.field }}</span>
    <span class="font-bold p-chip-text leading-5 pl-1">
      {{ formattedValue(props.itemFilter) }}</span
    >
  </Chip>
</template>
