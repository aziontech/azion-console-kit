<script setup>
  // CustomPageVersionAdapter — VersionShell child for Custom Page.
  // Hosts the VeeValidate useForm and registers the 7 lifecycle handlers via the
  // command bus. DEPLOY is a no-op (the deploy drawer owns deploying). The service
  // invalidates its own cache; this component never calls queryClient.
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import { onVersionCommand } from '@/composables/versioning/use-version-command'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { validationSchema } from '@/views/CustomPages/Config/validationSchema'
  import { customPageVersionService } from '@/services/v2/custom-page/custom-page-version-service'

  defineOptions({ name: 'custom-page-version-adapter' })

  const props = defineProps({
    customPage: {
      type: Object,
      required: true
    },
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    }
  })

  const { version } = useVersionContext()

  // Parent Custom Page base merged under the version config (the draft's saved
  // state wins). The nested `pages[]` array is preserved by the version adapter.
  const mergedValues = computed(() => ({
    ...props.customPage,
    ...(version.value?.config ?? {})
  }))

  const { values, meta, validate, resetForm } = useForm({
    validationSchema,
    initialValues: mergedValues.value
  })

  watch(mergedValues, (next) => {
    if (!meta.value.dirty) resetForm({ values: next })
  })
  watch(
    () => props.versionId,
    () => resetForm({ values: mergedValues.value })
  )

  const isFormValid = computed(() => meta.value.valid)

  onVersionCommand('SAVE', {
    ready: isFormValid,
    execute: async () => {
      const { valid } = await validate()
      if (!valid) return
      const result = await customPageVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      resetForm({ values: { ...values } })
      return result
    }
  })

  onVersionCommand('SAVE_AND_BUILD', {
    ready: isFormValid,
    execute: async ({ comment }) => {
      const { valid } = await validate()
      if (!valid) return
      const result = await customPageVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      await customPageVersionService.build(props.resourceId, props.versionId, { comment })
      resetForm({ values: { ...values } })
      return result
    }
  })

  onVersionCommand('ARCHIVE', ({ resourceId, versionId, comment }) =>
    customPageVersionService.archive(resourceId, versionId, { comment })
  )

  onVersionCommand('CANCEL_BUILD', ({ resourceId, versionId, comment }) =>
    customPageVersionService.cancelBuild(resourceId, versionId, { comment })
  )

  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId, versionId, comment }) =>
    customPageVersionService.createDraft(resourceId, {
      sourceVersionId: versionId,
      comment
    })
  )

  onVersionCommand('DELETE', ({ resourceId, versionId }) =>
    customPageVersionService.deleteVersion(resourceId, versionId)
  )

  onVersionCommand('DEPLOY', () => {})
</script>

<template>
  <slot />
</template>
