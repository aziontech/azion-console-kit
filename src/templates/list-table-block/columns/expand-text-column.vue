<template>
  <ul class="flex flex-col gap-1">
    <li>
      {{ splitValue }}
    </li>
    <li
      v-if="displayShowMore"
      @click.stop="showAll"
      class="underline cursor-pointer"
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
  const totalItems = textColumn.value?.length - SLICE_VALUE
  const formatValue = textColumn.value?.slice(0, SLICE_VALUE)
  const newValue = `${formatValue}${displayShowMore ? '...' : ''}`

  const splitValue = computed(() => {
    return showAllItems.value ? textColumn.value : newValue
  })

  const displayRemainingItems = computed(() => {
    return showAllItems.value ? 'Show less' : `Show more (${totalItems})`
  })

  const showAll = () => {
    showAllItems.value = !showAllItems.value
  }
</script>
