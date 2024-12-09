<template>
  <div class="flex flex-wrap items-center gap-1">
    <template
      v-for="(item, index) in displayedCriteria"
      :key="index"
    >
      <div class="flex items-center mr-2 truncate overflow-hidden text-ellipsis">
        <span class="font-bold">{{ item.conditional }}</span>
        <span class="font-bold">{{ item.operator }}</span>
        :
        <span class="ml-1">{{ item.argument }}</span>
      </div>
    </template>
    <PrimeTag
      v-if="extraCriteriaCount > 0"
      icon="pi pi-plus"
      class="text-sm"
      :value="`(${extraCriteriaCount} more)`"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeTag from 'primevue/tag'

  defineOptions({ name: 'criteria-column' })

  const props = defineProps({
    criteria: {
      type: Array,
      default: () => []
    }
  })

  const displayedCriteria = computed(() => props.criteria[0].slice(0, 2))
  const extraCriteriaCount = computed(() => Math.max(props.criteria.length, 0) - 1)
</script>
