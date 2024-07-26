<template>
  <div class="gap-3 flex items-center">
    <p>{{ text }}</p>
    <PrimeTag
      v-bind="tagProps"
      v-if="displayTag"
    />
  </div>
</template>

<script setup>
  import PrimeTag from 'primevue/tag'
  import { computed } from 'vue'

  const props = defineProps({
    text: String,
    tagProps: Object
  })

  const displayTag = computed(() => {
    return !!Object.keys(props.tagProps).length
  })
</script>
