<script setup>
  import VersionsTab from '@/views/EdgeFunctions/v6/tabs/VersionsTab.vue'
  import ResourceVersionLanding from '@/templates/version-shell-block/ResourceVersionLanding.vue'
  import { useResourceVersionLanding } from '@/composables/versioning/use-resource-version-landing'
  import { edgeFunctionService } from '@/services/v2/edge-function/edge-function-service'
  import { edgeFunctionVersionService } from '@/services/v2/edge-function/edge-function-version-service'

  defineOptions({ name: 'edge-functions-v6-edit-view' })

  const { resource, resourceId, isLoading, loadError } = useResourceVersionLanding({
    load: (id) => edgeFunctionService.loadEdgeFunctionService({ id }),
    provideKey: 'edgeFunction',
    versionService: edgeFunctionVersionService,
    resourceType: 'function',
    routeName: 'edit-functions',
    versionRouteName: 'edit-functions-version'
  })

  const pageDescription =
    "Each version is an isolated snapshot of this function's configuration. Edit a draft, then build it to publish an immutable version."
</script>

<template>
  <ResourceVersionLanding
    :is-loading="isLoading"
    :load-error="loadError"
    :title="resource?.name ?? ''"
    :description="pageDescription"
    :entity-name="resource?.name"
    error-message="Failed to load function. Try refreshing the page."
    :show-settings="false"
    testid-prefix="edge-functions-v6-edit"
  >
    <template #versions>
      <VersionsTab :edge-function-id="resourceId" />
    </template>
  </ResourceVersionLanding>
</template>
