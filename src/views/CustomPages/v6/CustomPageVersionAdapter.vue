<script setup>
  import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'
  import { customPageSaveStrategy } from '@/views/CustomPages/Config/version-save-strategy'
  import { validationSchema } from '@/views/CustomPages/Config/validationSchema'

  defineOptions({ name: 'custom-page-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: customPageVersionService,
    validationSchema,
    saveStrategy: customPageSaveStrategy
  })
</script>

<template>
  <slot />
</template>
