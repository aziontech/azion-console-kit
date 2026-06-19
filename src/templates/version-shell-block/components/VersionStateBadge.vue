<script setup>
  import PrimeTag from '@aziontech/webkit/prime-tag'

  defineOptions({ name: 'version-state-badge' })

  defineProps({
    state: {
      type: String,
      required: true
    }
  })

  /**
   * Visual mapping for the 7 canonical Version states.
   * Severity values come from the PrimeVue Tag: 'success' | 'info' | 'warning' | 'danger' | 'secondary'.
   * `active` reuses 'success' (same as ready) to communicate "built & stable".
   */
  const STATE_VISUAL = {
    draft: { severity: 'warning', label: 'Draft' },
    queued: { severity: 'info', label: 'Queued' },
    building: { severity: 'info', label: 'Building' },
    ready: { severity: 'success', label: 'Ready' },
    active: { severity: 'success', label: 'Active' },
    archived: { severity: 'secondary', label: 'Archived' },
    canceled: { severity: 'warning', label: 'Canceled' },
    error: { severity: 'danger', label: 'Error' }
  }
</script>

<template>
  <PrimeTag
    v-if="STATE_VISUAL[state]"
    :severity="STATE_VISUAL[state].severity"
    :value="STATE_VISUAL[state].label"
    :data-state="state"
    data-testid="version-state-badge"
  />
</template>
