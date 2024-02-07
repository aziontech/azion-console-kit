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
    removeValueItemFilter: {
      type: Function,
      required: true
    }
  })
</script>
<template>
  <Chip
    class="text-sm px-2 w-max"
    :label="props.itemFilter.field"
  />
  <span> in </span>
  <span> ( </span>
  <template
    v-for="(item, idx) in props.itemFilter.value"
    :key="item"
  >
    <Chip
      class="text-sm px-2 cursor-pointer w-max"
      @click="props.clickFilter(props.itemFilter, $event)"
      @remove="props.removeValueItemFilter(props.position, idx, $event)"
      removable
    >
      <span class="font-bold p-chip-text leading-5">
        {{ item.name || item.label || item }}
      </span>
    </Chip>
    <span v-if="props.itemFilter.value.length > idx + 1"> or </span>
    <span v-if="props.itemFilter.value.length === idx + 1"> ) </span>
  </template>
</template>
