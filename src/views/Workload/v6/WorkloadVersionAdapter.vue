<script setup>
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import { onVersionCommand } from '@/composables/versioning/use-version-command'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { workloadVersionService } from '@/services/v2/workload/workload-version-service'
  import { buildV6Schema } from '@/views/Workload/Config/validation'

  defineOptions({ name: 'workload-version-adapter' })

  const props = defineProps({
    workload: {
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

  const validationSchema = buildV6Schema()

  const { version } = useVersionContext()

  const mergedValues = computed(() => ({
    ...props.workload,
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

  // SAVE and SAVE_AND_BUILD both PUT the draft: the PUT runs save-and-build
  // automatically for workloads, so there is no separate build call.
  const saveDraft = async () => {
    const { valid } = await validate()
    if (!valid) return
    const result = await workloadVersionService.updateDraft(
      props.resourceId,
      props.versionId,
      values
    )
    resetForm({ values: { ...values } })
    return result
  }

  onVersionCommand('SAVE', { ready: isFormValid, execute: saveDraft })
  onVersionCommand('SAVE_AND_BUILD', { ready: isFormValid, execute: saveDraft })

  onVersionCommand('CANCEL_BUILD', ({ resourceId, versionId, comment }) =>
    workloadVersionService.cancelBuild(resourceId, versionId, { comment })
  )

  onVersionCommand('ARCHIVE', ({ resourceId, versionId, comment }) =>
    workloadVersionService.archive(resourceId, versionId, { comment })
  )

  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId, versionId, comment }) =>
    workloadVersionService.createDraft(resourceId, { sourceVersionId: versionId, comment })
  )

  onVersionCommand('DELETE', ({ resourceId, versionId }) =>
    workloadVersionService.deleteVersion(resourceId, versionId)
  )

  // DEPLOY is a no-op on the bus (deploy is owned by the deploy drawer, opened
  // from the heading); the handler stays registered so the footer dispatch resolves.
  onVersionCommand('DEPLOY', () => {})
</script>

<template>
  <slot />
</template>
