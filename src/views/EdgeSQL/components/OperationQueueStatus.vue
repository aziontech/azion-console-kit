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

  const STATUS_CONFIG = {
    processing: {
      color: 'primary',
      icon: 'pi pi-spin pi-spinner',
      textColor: 'text-primary-600'
    },
    pending: {
      color: 'warning',
      icon: 'pi pi-clock',
      textColor: 'text-yellow-600'
    },
    idle: {
      color: 'success',
      icon: 'pi pi-check-circle',
      textColor: 'text-green-600'
    },
    default: {
      color: 'secondary',
      icon: 'pi pi-info-circle',
      textColor: 'text-green-600'
    }
  }

  const getStatusConfig = (status) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.default
  }

  const statusColor = computed(() => {
    return getStatusConfig(props.queueSummary.status).color
  })

  const statusIcon = computed(() => {
    return getStatusConfig(props.queueSummary.status).icon
  })

  const statusTextColor = computed(() => {
    return getStatusConfig(props.queueSummary.status).textColor
  })
</script>

<template>
  <div
    v-if="!isEmpty || isProcessing"
    class="flex items-center gap-2 px-3 py-2 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg"
  >
    <i :class="[statusIcon, 'text-sm', statusTextColor]"></i>

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
