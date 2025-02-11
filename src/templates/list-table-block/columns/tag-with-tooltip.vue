<template>
  <div>
    <PrimeTag
      v-tooltip.top="{ value: tooltipText, showDelay: 200 }"
      v-bind="tagProps"
      v-if="displayTag"
    />
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'

  const props = defineProps({
    tooltipText: String,
    tagProps: Object
  })

  const displayTag = computed(() => {
    return !!Object.keys(props.tagProps).length
  })
</script>
