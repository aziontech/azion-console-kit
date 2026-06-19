<script setup>
  // Workload VersionShell form child. PUT auto-builds (doc §3): SAVE and
  // SAVE_AND_BUILD are the same write, so it overrides the save strategy on top of
  // the shared service + schema.
  import {
    useVersionFormAdapter,
    workloadSaveStrategy
  } from '@/composables/versioning/use-version-form-adapter'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'
  import { buildV6Schema } from '@/views/Workload/Config/validation'

  defineOptions({ name: 'workload-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: workloadVersionService,
    validationSchema: buildV6Schema(),
    saveStrategy: workloadSaveStrategy
  })
</script>

<template>
  <slot />
</template>
