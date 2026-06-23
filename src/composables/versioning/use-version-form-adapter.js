import { computed, toValue, watch } from 'vue'
import { useForm } from 'vee-validate'
import { onVersionCommand } from './use-version-command'
import { useVersionContext } from './use-version-context'
import { DEFAULT_CAPABILITY } from './version-capability'

// SAVE persists the draft; SAVE_AND_BUILD persists then builds. The version service
// owns its own cache invalidation.
export const defaultSaveStrategy = {
  save: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values),
  saveAndBuild: async ({ service, resourceId, versionId, values, comment }) => {
    const result = await service.updateDraft(resourceId, versionId, values)
    await service.build(resourceId, versionId, { comment })
    return result
  }
}

// Workloads auto-build on PUT (doc §3): SAVE and SAVE_AND_BUILD are the same write,
// with no separate build call.
export const workloadSaveStrategy = {
  save: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values),
  saveAndBuild: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values)
}

/**
 * useVersionFormAdapter — the single source of truth for a VersionShell form child.
 *
 * Hosts the VeeValidate form (resource base merged under the version config) and
 * registers the 7 lifecycle handlers on the command bus ONCE. Each resource adapter
 * is a thin `<script setup>` that calls this with its three specializations:
 * `versionService`, `validationSchema` and `saveStrategy` (defaults to save/build).
 * DEPLOY is a deployable-only no-op (the deploy drawer in the heading owns it);
 * for `versioned-only` it is not registered, so the footer drops it and dispatch
 * fail-closes. `capability` defaults to the version-context's (deployable outside).
 *
 * `resource`, `resourceId` and `versionId` accept refs/getters so the form stays in
 * sync with the host props.
 */
export function useVersionFormAdapter({
  resource,
  resourceId,
  versionId,
  versionService,
  validationSchema,
  saveStrategy = defaultSaveStrategy,
  capability
}) {
  const { version, capability: contextCapability } = useVersionContext()
  // Option override wins; otherwise the shell-provided capability; deployable if absent.
  const resolvedCapability = computed(
    () => toValue(capability) ?? toValue(contextCapability) ?? DEFAULT_CAPABILITY
  )

  // Parent resource base merged under the version config (the draft's saved state
  // wins). Nested arrays (e.g. custom page `pages[]`) are preserved by the service.
  const mergedValues = computed(() => ({
    ...(toValue(resource) ?? {}),
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
    () => toValue(versionId),
    () => resetForm({ values: mergedValues.value })
  )

  const isFormValid = computed(() => meta.value.valid)

  const runSave = async ({ build, comment }) => {
    const { valid } = await validate()
    // Throw (not silent return) so the shell emits `command-error`, not a false
    // `updated` success that would toast + navigate without anything being saved.
    if (!valid) throw new Error('Please review the highlighted fields and try again.')
    const ctx = {
      service: versionService,
      resourceId: toValue(resourceId),
      versionId: toValue(versionId),
      resource: toValue(resource),
      values,
      comment
    }
    const result = build ? await saveStrategy.saveAndBuild(ctx) : await saveStrategy.save(ctx)
    resetForm({ values: { ...values } })
    return result
  }

  onVersionCommand('SAVE', { ready: isFormValid, execute: () => runSave({ build: false }) })
  onVersionCommand('SAVE_AND_BUILD', {
    ready: isFormValid,
    execute: ({ comment }) => runSave({ build: true, comment })
  })

  onVersionCommand('ARCHIVE', ({ resourceId: rid, versionId: vid, comment }) =>
    versionService.archive(rid, vid, { comment })
  )
  onVersionCommand('CANCEL_BUILD', ({ resourceId: rid, versionId: vid, comment }) =>
    versionService.cancelBuild(rid, vid, { comment })
  )
  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId: rid, versionId: vid, comment }) =>
    versionService.createDraft(rid, { sourceVersionId: vid, comment })
  )
  onVersionCommand('DELETE', ({ resourceId: rid, versionId: vid }) =>
    versionService.deleteVersion(rid, vid)
  )
  // Register DEPLOY only for deployable classes; versioned-only omits it so the
  // footer (availableActions ∩ registered) drops it and dispatch fail-closes.
  if (resolvedCapability.value.canDeploy) {
    onVersionCommand('DEPLOY', () => {})
  }

  return { values, meta, isFormValid }
}
