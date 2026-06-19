<script setup>
  import { ref } from 'vue'
  import VersionHeadingActions from '@/templates/version-shell-block/components/VersionHeadingActions.vue'
  import { useCustomPageDeployContext } from '@/views/CustomPages/v6/use-custom-page-deploy-context'

  defineOptions({ name: 'custom-page-version-heading-actions' })

  // Custom Page adapter: builds the deploy `resourceContext` (ready versions of
  // this Custom Page) and forwards `openDeployDrawer` so the VersionShell footer
  // DEPLOY opens the SAME drawer.
  const { resourceContext } = useCustomPageDeployContext()

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
