<script setup>
  import { ref } from 'vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import { useApplicationDeployContext } from '@/views/EdgeApplications/v6/use-application-deploy-context'

  defineOptions({ name: 'application-version-heading-actions' })

  // Application-specific adapter: builds the deploy `resourceContext` (ready
  // versions of this Application) and forwards `openDeployDrawer` so the
  // VersionShell footer DEPLOY opens the SAME drawer.
  const { resourceContext } = useApplicationDeployContext()

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
