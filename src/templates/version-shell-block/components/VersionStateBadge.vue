<script setup>
  import { computed } from 'vue'
  import PrimeTag from '@aziontech/webkit/prime-tag'

  defineOptions({ name: 'version-state-badge' })

  const props = defineProps({
    state: {
      type: String,
      required: true
    },
    isCurrent: {
      type: Boolean,
      default: false
    }
  })

  const STATE_VISUAL = {
    draft: { severity: 'warning', label: 'Draft', icon: 'pi pi-file-edit' },
    queued: { severity: 'info', label: 'Queued', icon: 'pi pi-clock' },
    building: { severity: 'info', label: 'Building', icon: 'pi pi-spinner animate-spin' },
    ready: { severity: 'success', label: 'Ready', icon: 'pi pi-circle-fill' },
    active: { severity: 'success', label: 'Active' },
    archiving: { severity: 'secondary', label: 'Archiving', icon: 'pi pi-spinner animate-spin' },
    archived: { severity: 'secondary', label: 'Archived' },
    canceled: { severity: 'warning', label: 'Canceled' },
    error: { severity: 'danger', label: 'Error', icon: 'pi pi-exclamation-triangle' }
  }

  const CURRENT_VISUAL = { severity: 'success', label: 'Current', icon: 'pi pi-circle-fill' }

  const visual = computed(() => {
    const isBuilt = props.state === 'ready' || props.state === 'active'
    if (props.isCurrent && isBuilt) return CURRENT_VISUAL
    return STATE_VISUAL[props.state] ?? null
  })
</script>

<template>
  <PrimeTag
    v-if="visual"
    :severity="visual.severity"
    :value="visual.label"
    :icon="visual.icon"
    :data-state="state"
    :data-current="isCurrent || state === 'active' ? '' : null"
    data-testid="version-state-badge"
    rounded
  />
</template>

<style scoped>
  :deep(.p-tag-icon) {
    font-size: 0.625rem;
  }
</style>
