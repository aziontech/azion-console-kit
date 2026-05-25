<script setup>
  import StatusTag from '@/views/DeploymentVersions/components/StatusTag.vue'

  defineOptions({ name: 'deployment-status-duration-cell' })

  defineProps({
    status: {
      type: Object,
      default: () => ({ content: 'Unknown', severity: 'secondary' })
    },
    duration: {
      type: String,
      default: ''
    }
  })
</script>

<template>
  <div class="min-w-0 flex flex-col gap-1">
    <StatusTag :status="status" />
    <span
      v-if="duration"
      class="font-mono text-xs leading-relaxed text-[var(--text-color-secondary)]"
    >
      {{ duration }}
    </span>
  </div>
</template>
