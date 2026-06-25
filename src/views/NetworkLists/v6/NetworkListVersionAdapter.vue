<script setup>
  // Network List VersionShell form child. Thin adapter: wires the shared
  // service + existing Network List schema into the version form lifecycle.
  import {
    useVersionFormAdapter,
    defaultSaveStrategy
  } from '@/composables/versioning/use-version-form-adapter'
  import { networkListVersionService } from '@/services/v2/network-lists/network-list-version-service'
  import { validationSchema } from '@/views/NetworkLists/Config/validation'

  defineOptions({ name: 'network-list-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: networkListVersionService,
    validationSchema,
    saveStrategy: defaultSaveStrategy
  })
</script>

<template>
  <slot />
</template>
