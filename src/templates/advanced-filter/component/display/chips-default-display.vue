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
    <span class="p-chip-text"> {{ props.itemFilter.field }}</span>
    <span class="font-bold p-chip-text leading-5 pl-1">
      {{ `${props.itemFilter.format} ${props.itemFilter.value}` }}</span
    >
  </Chip>
</template>
