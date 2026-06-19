<script setup>
  import { ref } from 'vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import { useFirewallDeployContext } from '@/views/EdgeFirewall/v6/use-firewall-deploy-context'

  defineOptions({ name: 'edge-firewall-version-heading-actions' })

  // Firewall-specific adapter: builds the deploy `resourceContext` (ready versions
  // of this Firewall) and forwards `openDeployDrawer` so the VersionShell footer
  // DEPLOY opens the SAME drawer.
  const { resourceContext } = useFirewallDeployContext()

  const headingRef = ref(null)
  const openDeployDrawer = () => headingRef.value?.openDeployDrawer()

  defineExpose({ openDeployDrawer })
</script>

<template>
  <VersionHeadingActions
    ref="headingRef"
    :resource-context="resourceContext"
  />
</template>
