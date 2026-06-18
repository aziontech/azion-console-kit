<script setup>
  /**
   * VersionTabAddButton — the active-tab "+ Add" button for the v6 EditView tabs.
   *
   * Lives inside the VersionShell slot so `useVersionContext()` injects the real
   * `readOnly` (req 8.2), but Teleports its DOM into the page heading
   * (`#version-tab-add-action`) so it sits next to the version badge.
   *
   * Renders only when the active `tab` supports create AND the version is editable
   * (req 8.1 / 8.2). The parent passes the active tab descriptor and the resolved
   * tab component instance, on which it calls `openCreateDrawer()`.
   */
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { useVersionContext } from '@/composables/versioning/use-version-context'

  defineOptions({ name: 'version-tab-add-button' })

  const props = defineProps({
    tab: {
      type: Object,
      default: null
    },
    activeComponent: {
      type: Object,
      default: null
    }
  })

  const { readOnly } = useVersionContext()

  const isVisible = computed(() => Boolean(props.tab?.canCreate) && !readOnly.value)

  const label = computed(() => props.tab?.addButtonLabel || 'Create')

  const handleClick = () => {
    props.activeComponent?.openCreateDrawer?.()
  }
</script>

<template>
  <Teleport
    v-if="isVisible"
    to="#version-tab-add-action"
  >
    <PrimeButton
      :label="label"
      size="small"
      icon="pi pi-plus"
      @click="handleClick"
      data-testid="edge-applications-v6-edit__add-button"
    />
  </Teleport>
</template>
