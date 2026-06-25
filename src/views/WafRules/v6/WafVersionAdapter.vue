<script setup>
  // WAF VersionShell form child. Thin adapter: wires the shared service +
  // existing WAF schema into the version form lifecycle.
  import {
    useVersionFormAdapter,
    defaultSaveStrategy
  } from '@/composables/versioning/use-version-form-adapter'
  import { wafVersionService } from '@/services/v2/waf/waf-version-service'
  import { validationSchema } from '@/views/WafRules/Config/validation'

  defineOptions({ name: 'waf-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: wafVersionService,
    validationSchema,
    saveStrategy: defaultSaveStrategy
  })
</script>

<template>
  <slot />
</template>
