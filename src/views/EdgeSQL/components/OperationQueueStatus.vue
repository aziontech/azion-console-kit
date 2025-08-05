<script setup>
  import { computed } from 'vue'
  import Tag from 'primevue/tag'
  import Badge from 'primevue/badge'

  const props = defineProps({
    stats: {
      type: Object,
      required: true
    },
    isProcessing: {
      type: Boolean,
      default: false
    },
    isEmpty: {
      type: Boolean,
      default: true
    },
    queueSummary: {
      type: Object,
      required: true
    }
  })

  const statusColor = computed(() => {
    switch (props.queueSummary.status) {
      case 'processing':
        return 'primary'
      case 'pending':
        return 'warning'
      case 'idle':
        return 'success'
      default:
        return 'secondary'
    }
  })

  const statusIcon = computed(() => {
    switch (props.queueSummary.status) {
      case 'processing':
        return 'pi pi-spin pi-spinner'
      case 'pending':
        return 'pi pi-clock'
      case 'idle':
        return 'pi pi-check-circle'
      default:
        return 'pi pi-info-circle'
    }
  })
</script>

<template>
  <div
    v-if="!isEmpty || isProcessing"
    class="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg"
  >
    <i
      :class="[
        statusIcon,
        'text-sm',
        queueSummary.status === 'processing'
          ? 'text-primary-600'
          : queueSummary.status === 'pending'
          ? 'text-yellow-600'
          : 'text-green-600'
      ]"
    ></i>

    <Tag
      :value="queueSummary.text"
      :severity="statusColor"
      class="text-xs"
    />

    <div
      v-if="stats.creating > 0 || stats.deleting > 0"
      class="flex items-center gap-1"
    >
      <Badge
        v-if="stats.creating > 0"
        :value="stats.creating"
        severity="warning"
        class="text-xs"
        v-tooltip.top="`${stats.creating} database${stats.creating > 1 ? 's' : ''} being created`"
      />
      <Badge
        v-if="stats.deleting > 0"
        :value="stats.deleting"
        severity="danger"
        class="text-xs"
        v-tooltip.top="`${stats.deleting} database${stats.deleting > 1 ? 's' : ''} being deleted`"
      />
    </div>
  </div>
</template>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
