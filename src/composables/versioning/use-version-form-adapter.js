import { computed, toValue, watch } from 'vue'
import { useForm } from 'vee-validate'
import { onVersionCommand } from './use-version-command'
import { useVersionContext } from './use-version-context'
import { DEFAULT_CAPABILITY } from './version-capability'

export const defaultSaveStrategy = {
  save: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values),
  saveAndBuild: async ({ service, resourceId, versionId, values, comment }) => {
    const result = await service.updateDraft(resourceId, versionId, values)
    await service.build(resourceId, versionId, { comment })
    return result
  }
}

export const workloadSaveStrategy = {
  save: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values),
  saveAndBuild: ({ service, resourceId, versionId, values }) =>
    service.updateDraft(resourceId, versionId, values)
}

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
  const resolvedCapability = computed(
    () => toValue(capability) ?? toValue(contextCapability) ?? DEFAULT_CAPABILITY
  )

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
  if (resolvedCapability.value.canDeploy) {
    onVersionCommand('DEPLOY', () => {})
  }

  return { values, meta, isFormValid }
}
