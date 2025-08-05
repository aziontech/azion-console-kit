<script setup>
  import GeneralEdgeApp from './block/generalEdgeApp'
  import ModuleEdgeApp from './block/moduleEdgeApp'
  import StatusEdgeApp from './block/statusEdgeApp'
  import DebugRulesEdgeApp from './block/debugEdgeApp'

  defineProps({
    handleBlock: {
      type: Array,
      required: false,
      default: () => ['full']
    },
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
