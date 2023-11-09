<template>
  <ul class="flex flex-col gap-1">
    <li
      v-for="(item, index) in splitValue"
      :key="index"
    >
      {{ item }}
    </li>
    <li
      v-if="displayShowMore"
      @click="showAll"
      class="underline cursor-pointer"
    >
      {{ displayRemainingItems }}
    </li>
  </ul>
</template>

<script setup>
  defineOptions({ name: 'expand-column' })
  import { ref, computed } from 'vue'
  const props = defineProps({
    value: {
      type: Array,
      required: true
    }
  })

  const showAllItems = ref(false)

  const SLICE_VALUE = 2

  const formatValue = props.value.slice(0, SLICE_VALUE)

  const totalItems = props.value.length - SLICE_VALUE
  const displayShowMore = props.value.length > SLICE_VALUE

  const splitValue = computed(() => {
    return showAllItems.value ? props.value : formatValue
  })

  const displayRemainingItems = computed(() => {
    return showAllItems.value ? 'Show less' : `Show more (${totalItems})`
  })

  const showAll = () => {
    showAllItems.value = !showAllItems.value
  }
</script>
