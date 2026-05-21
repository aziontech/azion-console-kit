<script setup>
  import PrimeButton from '@aziontech/webkit/button'

  defineOptions({ name: 'LoadMoreFooter' })

  defineProps({
    isLoadingMore: { type: Boolean, default: false },
    hasMoreData: { type: Boolean, default: false },
    tableLength: { type: Number, default: 0 },
    recordsFound: { type: [String, Number], default: '' },
    pageSize: { type: [Number, String], default: 50 }
  })

  const emit = defineEmits(['load-more'])
</script>

<template>
  <div
    v-if="isLoadingMore"
    class="flex items-center justify-center gap-2 py-2 px-2 shrink-0 load-more-footer"
  >
    <i class="pi pi-spin pi-spinner text-color-secondary" />
    <span class="text-xs text-color-secondary">Loading more records…</span>
  </div>
  <div
    v-else-if="tableLength > 0 && hasMoreData"
    class="flex items-center justify-center gap-2 py-2 px-2 shrink-0 load-more-footer"
  >
    <PrimeButton
      :label="'Load more ' + pageSize"
      icon="pi pi-arrow-down"
      text
      size="small"
      @click="emit('load-more')"
    />
    <span class="text-xs text-color-secondary"
      >{{ tableLength }} of {{ recordsFound }} documents</span
    >
  </div>
  <div
    v-else-if="!hasMoreData && tableLength > 0"
    class="flex items-center justify-center gap-2 py-2 px-2 shrink-0 load-more-footer"
  >
    <span class="text-xs text-color-secondary">All documents loaded</span>
  </div>
</template>

<style scoped>
  .load-more-footer {
    border-top: 1px solid var(--surface-border);
    background: var(--surface-card);
  }
</style>
