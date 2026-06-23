<script setup>
  /**
   * VersionTabAddButton — the active-tab "+ Add" button for the v6 EditView tabs.
   *
   * Lives inside the VersionShell slot so `useVersionContext()` injects the real
   * `readOnly` (req 8.2). Rendered as the default content of the shell's
   * `#tab-actions` slot, pinned to the right of the tab bar (not the page heading).
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
    },
    // Per-resource so the e2e selector is unique; defaults to the Application
    // prefix for back-compat with its existing spec.
    testidPrefix: {
      type: String,
      default: 'application-v6-edit'
    }
  })

  const { readOnly } = useVersionContext()

  const isVisible = computed(() => Boolean(props.tab?.canCreate) && !readOnly.value)

  const label = computed(() => props.tab?.addButtonLabel || 'Create')

  const addButtonTestid = computed(() => `${props.testidPrefix}__add-button`)

  const handleClick = () => {
    props.activeComponent?.openCreateDrawer?.()
  }
</script>

<template>
  <PrimeButton
    v-if="isVisible"
    :label="label"
    size="small"
    icon="pi pi-plus"
    @click="handleClick"
    :data-testid="addButtonTestid"
  />
</template>
