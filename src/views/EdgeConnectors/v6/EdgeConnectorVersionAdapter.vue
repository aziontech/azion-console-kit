<script setup>
  // Edge Connector VersionShell form child. Thin adapter: wires the shared
  // service + existing Connector schema into the version form lifecycle.
  import {
    useVersionFormAdapter,
    defaultSaveStrategy
  } from '@/composables/versioning/use-version-form-adapter'
  import { edgeConnectorVersionService } from '@/services/v2/edge-connectors/edge-connector-version-service'
  import { validationSchema } from '@/views/EdgeConnectors/Config/validation'

  defineOptions({ name: 'edge-connector-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: edgeConnectorVersionService,
    validationSchema,
    saveStrategy: defaultSaveStrategy
  })
</script>

<template>
  <slot />
</template>
