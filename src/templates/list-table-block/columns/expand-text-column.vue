<template>
  <ul class="flex flex-col gap-1">
    <li
      class="whitespace-pre"
      data-testid="table-column-expand-text-column__value"
    >
      {{ textToShow }}
    </li>
    <li
      v-if="displayShowMore"
      @click.stop="showAll"
      class="underline cursor-pointer"
      data-testid="table-column-expand-text-column__show-more__toggle"
    >
      {{ displayRemainingItems }}
    </li>
  </ul>
</template>

<script setup>
  import { ref, computed } from 'vue'
  defineOptions({ name: 'expand-text-column' })
  const props = defineProps({
    value: {
      type: String,
      required: true
    }
  })

  const showAllItems = ref(false)
  const textColumn = ref(props.value)
  const SLICE_VALUE = 15
  const displayShowMore = textColumn.value?.length > SLICE_VALUE

  const formatValue = textColumn.value?.toString().slice(0, SLICE_VALUE)
  const newValue = `${formatValue}${displayShowMore ? '...' : ''}`

  const textToShow = computed(() => {
    return showAllItems.value ? textColumn.value : newValue
  })

  const displayRemainingItems = computed(() => {
    return showAllItems.value ? 'Show less' : 'Show more'
  })

  const showAll = () => {
    showAllItems.value = !showAllItems.value
  }
</script>
