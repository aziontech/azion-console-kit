<script setup>
  // Application VersionShell form child. Specializes the shared adapter with its
  // service + schema; the default save strategy (save / save+build) applies.
  import * as yup from 'yup'
  import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'application-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: edgeAppVersionService,
    validationSchema: yup.object({ name: yup.string().required() })
  })
</script>

<template>
  <slot />
</template>
