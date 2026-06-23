<script setup>
  // Deployment VersionShell form child. The form body is FormFieldsDeployment,
  // whose fields live on the deployment stream (name/policies/strategy defaults),
  // so SAVE persists via updateDeploymentAdapter; SAVE_AND_BUILD persists then
  // builds the version. The remaining lifecycle commands (ARCHIVE/CANCEL_BUILD/
  // NEW_DRAFT_FROM/DELETE) act on the version via deploymentVersionService and are
  // registered by the shared useVersionFormAdapter.
  import { useVersionFormAdapter } from '@/composables/versioning/use-version-form-adapter'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
  import { updateDeploymentAdapter } from '@/views/Deployments/Config/adapters'
  import { validationSchema } from '@/views/Deployments/Config/validation'

  defineOptions({ name: 'deployment-version-adapter' })

  const props = defineProps({
    resource: { type: Object, required: true },
    resourceId: { type: [String, Number], required: true },
    versionId: { type: String, required: true }
  })

  const deploymentSaveStrategy = {
    save: ({ resourceId, values }) => updateDeploymentAdapter(resourceId, { ...values }),
    saveAndBuild: async ({ service, resourceId, versionId, values, comment }) => {
      const result = await updateDeploymentAdapter(resourceId, { ...values })
      await service.build(resourceId, versionId, { comment })
      return result
    }
  }

  useVersionFormAdapter({
    resource: () => props.resource,
    resourceId: () => props.resourceId,
    versionId: () => props.versionId,
    versionService: deploymentVersionService,
    validationSchema,
    saveStrategy: deploymentSaveStrategy
  })
</script>

<template>
  <slot />
</template>
