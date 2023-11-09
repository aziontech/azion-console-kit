<template>
  <ul class="flex flex-col gap-1">
    <li>
      {{ splitValue }}
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
  defineOptions({ name: 'expand-text-column' })
  import { ref, computed } from 'vue'
  const props = defineProps({
    value: {
      type: String,
      required: true
    }
  })

  const showAllItems = ref(false)
  const SLICE_VALUE = 15
  const textColumn = ref(props.value)
  const formatValue = textColumn.value.slice(0, SLICE_VALUE)

  const totalItems = textColumn.value.length - SLICE_VALUE
  const displayShowMore = textColumn.value.length > SLICE_VALUE

  const splitValue = computed(() => {
    return showAllItems.value ? textColumn.value : `${formatValue}...`
  })

  const displayRemainingItems = computed(() => {
    return showAllItems.value ? 'Show less' : `Show more (${totalItems})`
  })

  const showAll = () => {
    showAllItems.value = !showAllItems.value
  }
</script>
