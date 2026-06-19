<script setup>
  /**
   * ApplicationVersionAdapter — VersionShell child for Application.
   *
   * Hosts:
   *  - VeeValidate useForm() with the Application's schema/initialValues.
   *  - isFormValid: Ref<boolean> derived from meta.valid.
   *  - 7 handlers registered via onVersionCommand:
   *      SAVE, SAVE_AND_BUILD, ARCHIVE, CANCEL_BUILD, NEW_DRAFT_FROM, DELETE
   *      and DEPLOY (intentional no-op — deploying is owned by the deploy drawer,
   *      opened locally from the heading "Deploy" button, not by this bus).
   *
   * The field components (descendants) use useField, which auto-connects to this
   * useForm through VeeValidate's internal provide. No extra provide/inject is
   * needed.
   *
   * Cache: the edgeAppVersionService handles invalidating its own queries on
   * every mutation. This component does NOT call queryClient.
   */
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { onVersionCommand } from '@/composables/versioning/use-version-command'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'application-version-adapter' })

  const props = defineProps({
    application: {
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

  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const { version } = useVersionContext()

  const mergedValues = computed(() => ({
    ...props.application,
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
      const result = await edgeAppVersionService.updateDraft(
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
      const result = await edgeAppVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      await edgeAppVersionService.build(props.resourceId, props.versionId, { comment })
      resetForm({ values: { ...values } })
      return result
    }
  })

  onVersionCommand('ARCHIVE', ({ resourceId, versionId, comment }) =>
    edgeAppVersionService.archive(resourceId, versionId, { comment })
  )

  onVersionCommand('CANCEL_BUILD', ({ resourceId, versionId, comment }) =>
    edgeAppVersionService.cancelBuild(resourceId, versionId, { comment })
  )

  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId, versionId, comment }) =>
    edgeAppVersionService.createDraft(resourceId, {
      sourceVersionId: versionId,
      comment
    })
  )

  onVersionCommand('DELETE', ({ resourceId, versionId }) =>
    edgeAppVersionService.deleteVersion(resourceId, versionId)
  )

  onVersionCommand('DEPLOY', () => {})
</script>

<template>
  <slot />
</template>
