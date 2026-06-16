<script setup>
  /**
   * ApplicationVersionAdapter — VersionShell child for Application.
   *
   * Hosts:
   *  - VeeValidate useForm() with the Application's schema/initialValues.
   *  - isFormValid: Ref<boolean> derived from meta.valid.
   *  - 7 handlers registered via onVersionCommand:
   *      SAVE, SAVE_AND_BUILD, ARCHIVE, CANCEL_BUILD, NEW_DRAFT_FROM, DELETE, DEPLOY
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

  // Lean schema for the v4 form: only `name` is required. The toggle fields
  // (edgeCacheEnabled, debug, etc.) need no validation. Legacy V3 fields
  // (httpPort/httpsPort/deliveryProtocol) no longer exist in this shape.
  const validationSchema = yup.object({
    name: yup.string().required()
  })

  const { version } = useVersionContext()

  // Merge: parent Application base + config persisted in the version (subset of
  // the form UI). The version config takes precedence — reflects the draft's
  // saved state. Empty when the GET returns metadata only (form falls back to
  // the parent Application).
  const mergedValues = computed(() => ({
    ...props.application,
    ...(version.value?.config ?? {})
  }))

  const { values, meta, validate, resetForm } = useForm({
    validationSchema,
    initialValues: mergedValues.value
  })

  // Post-mutation refetch / application reloaded: re-syncs the form
  // only when there is no pending edit (dirty preserves the user's work).
  watch(mergedValues, (next) => {
    if (!meta.value.dirty) resetForm({ values: next })
  })
  // Version switch = new context: unconditional reset.
  watch(
    () => props.versionId,
    () => resetForm({ values: mergedValues.value })
  )

  // Gate for the SAVE/SAVE_AND_BUILD buttons: meta.valid reflects the real validity
  // (vee-validate runs an initial silent validation on mount). The shell reads this
  // ref through the bus — which uses shallowRef precisely to avoid unwrapping it.
  const isFormValid = computed(() => meta.value.valid)

  onVersionCommand('SAVE', {
    ready: isFormValid,
    execute: async () => {
      const { valid } = await validate()
      if (!valid) return
      // Save Draft is a full replace (PUT): the form holds the complete editable
      // state of the draft, so we send the whole set rather than a partial PATCH.
      const result = await edgeAppVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      // Saved state becomes the new baseline — clears dirty to allow re-sync.
      resetForm({ values: { ...values } })
      return result
    }
  })

  onVersionCommand('SAVE_AND_BUILD', {
    ready: isFormValid,
    execute: async ({ comment }) => {
      const { valid } = await validate()
      if (!valid) return
      // Full replace (PUT), same as SAVE: the form holds the complete editable
      // state of the draft, so we send the whole set rather than a partial PATCH.
      const result = await edgeAppVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      // Only triggers the build if the save succeeded.
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

  // Returns the created draft (ULID id) — essential for post-NEW_DRAFT_FROM navigation.
  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId, versionId, comment }) =>
    edgeAppVersionService.createDraft(resourceId, {
      sourceVersionId: versionId,
      comment
    })
  )

  onVersionCommand('DELETE', ({ resourceId, versionId }) =>
    edgeAppVersionService.deleteVersion(resourceId, versionId)
  )

  onVersionCommand('DEPLOY', ({ resourceId, versionId }) => {
    // eslint-disable-next-line no-console
    console.warn(
      `[ApplicationVersionAdapter] DEPLOY is a placeholder — no API call performed (app ${resourceId}, version ${versionId})`
    )
  })
</script>

<template>
  <slot />
</template>
