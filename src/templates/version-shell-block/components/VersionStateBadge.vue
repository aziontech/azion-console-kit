<script setup>
  import { computed } from 'vue'
  import PrimeTag from '@aziontech/webkit/prime-tag'

  defineOptions({ name: 'version-state-badge' })

  // `isCurrent` lets the host mark the version in use when the API has no
  // current field: a built (ready/active) version then reads as "Current".
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

  /**
   * Visual mapping for the 7 canonical Version states.
   * Severity values come from the PrimeVue Tag: 'success' | 'info' | 'warning' | 'danger' | 'secondary'.
   * `active` is the version in use, labelled "Current" to disambiguate from the
   * resource Active/Inactive enablement tag.
   */
  const STATE_VISUAL = {
    draft: { severity: 'warning', label: 'Draft', icon: 'pi pi-file-edit' },
    queued: { severity: 'info', label: 'Queued', icon: 'pi pi-clock' },
    building: { severity: 'info', label: 'Building', icon: 'pi pi-spin pi-spinner' },
    ready: { severity: 'success', label: 'Ready', icon: 'pi pi-circle-fill' },
    active: { severity: 'success', label: 'Active' },
    archiving: { severity: 'secondary', label: 'Archiving', icon: 'pi pi-spin pi-spinner' },
    archived: { severity: 'secondary', label: 'Archived' },
    canceled: { severity: 'warning', label: 'Canceled' },
    error: { severity: 'danger', label: 'Error', icon: 'pi pi-exclamation-triangle' }
  }

  // Latest-Ready fallback: a built version flagged current borrows the "Current"
  // presentation without depending on an `active` state from the API.
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
  /* The state dot uses the default PrimeIcons size, which reads oversized inside a
     small status tag — shrink it for a subtler badge. */
  :deep(.p-tag-icon) {
    font-size: 0.625rem;
  }
</style>
