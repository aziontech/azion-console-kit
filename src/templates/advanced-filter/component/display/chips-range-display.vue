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
    clickFilter: {
      type: Function,
      required: true
    },
    removeItemFilter: {
      type: Function,
      required: true
    }
  })
</script>
<template>
  <Chip
    class="text-sm px-2 cursor-pointer w-max"
    removable
    @click="props.clickFilter(props.itemFilter, $event)"
    @remove="props.removeItemFilter(props.position, $event)"
  >
    <span class="font-bold p-chip-text leading-5 pr-1">
      {{ `${props.itemFilter.value.begin} ${props.itemFilter.format} ` }}</span
    >
    <span class="p-chip-text"> {{ props.itemFilter.field }}</span>
    <span class="font-bold p-chip-text leading-5 pl-1">
      {{ `${props.itemFilter.format} ${props.itemFilter.value.end}` }}</span
    >
  </Chip>
</template>
