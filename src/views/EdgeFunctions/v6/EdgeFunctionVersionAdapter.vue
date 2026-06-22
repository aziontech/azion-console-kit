<script setup>
  // Edge Function VersionShell form child. Thin adapter: wires the shared service +
  // schema into the framework's useVersionFormAdapter with the default save strategy.
  import {
    useVersionFormAdapter,
    defaultSaveStrategy
  } from '@/composables/versioning/use-version-form-adapter'
  import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'
  import { validationSchema } from '@/views/EdgeFunctions/Config/validationSchema'

  defineOptions({ name: 'edge-function-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: edgeFunctionVersionService,
    validationSchema,
    saveStrategy: defaultSaveStrategy
  })
</script>

<template>
  <slot />
</template>
