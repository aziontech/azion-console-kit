<script setup>
  import GeneralEdgeApp from './block/generalEdgeApp'
  import ModuleEdgeApp from './block/moduleEdgeApp'
  import DebugRulesEdgeApp from './block/debugEdgeApp'
  import StatusEdgeApp from './block/statusEdgeApp'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })
</script>

<template>
  <GeneralEdgeApp :isDrawer="isDrawer" />
  <ModuleEdgeApp :isDrawer="isDrawer" />
  <DebugRulesEdgeApp :isDrawer="isDrawer" />
  <StatusEdgeApp :isDrawer="isDrawer" />
</template>
