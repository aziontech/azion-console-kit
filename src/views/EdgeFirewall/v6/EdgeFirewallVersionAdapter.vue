<script setup>
  /**
   * EdgeFirewallVersionAdapter — VersionShell child for Edge Firewall.
   *
   * Hosts the VeeValidate useForm() (firewall main-settings schema + merged
   * initial values), exposes isFormValid and registers the 7 lifecycle handlers
   * via onVersionCommand. The edgeFirewallVersionService owns cache invalidation;
   * this component never calls queryClient.
   */
  import { computed, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { onVersionCommand } from '@/composables/versioning/use-version-command'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'edge-firewall-version-adapter' })

  const props = defineProps({
    firewall: {
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
    name: yup.string().required().label('Name'),
    edgeFunctionsEnabled: yup.boolean().label('Functions'),
    networkProtectionEnabled: yup.boolean().label('Network Shield'),
    wafEnabled: yup.boolean().label('WAF'),
    isActive: yup.boolean().label('Active')
  })

  const { version } = useVersionContext()

  // Merge: parent Firewall base + config persisted in the version (subset of the
  // form UI). The version config wins. Empty when the GET returns metadata only.
  const mergedValues = computed(() => ({
    ...props.firewall,
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
      const result = await edgeFirewallVersionService.updateDraft(
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
      const result = await edgeFirewallVersionService.updateDraft(
        props.resourceId,
        props.versionId,
        values
      )
      await edgeFirewallVersionService.build(props.resourceId, props.versionId, { comment })
      resetForm({ values: { ...values } })
      return result
    }
  })

  onVersionCommand('ARCHIVE', ({ resourceId, versionId, comment }) =>
    edgeFirewallVersionService.archive(resourceId, versionId, { comment })
  )

  onVersionCommand('CANCEL_BUILD', ({ resourceId, versionId, comment }) =>
    edgeFirewallVersionService.cancelBuild(resourceId, versionId, { comment })
  )

  onVersionCommand('NEW_DRAFT_FROM', ({ resourceId, versionId, comment }) =>
    edgeFirewallVersionService.createDraft(resourceId, {
      sourceVersionId: versionId,
      comment
    })
  )

  onVersionCommand('DELETE', ({ resourceId, versionId }) =>
    edgeFirewallVersionService.deleteVersion(resourceId, versionId)
  )

  onVersionCommand('DEPLOY', () => {})
</script>

<template>
  <slot />
</template>
