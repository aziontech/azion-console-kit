<script setup>
  import { toRef } from 'vue'
  import Button from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useToast } from '@aziontech/webkit/use-toast'
  import InfoDrawerBlock from '@/templates/info-drawer-block/index.vue'
  import DeploymentReleaseDetails from '@/views/Deployments/components/DeploymentReleaseDetails.vue'
  import { useDeploymentReleaseDrawer } from '@/composables/versioning/use-deployment-release-drawer'

  defineOptions({ name: 'deployment-release-drawer' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    release: {
      type: Object,
      default: null
    },
    // Uniform rollback/redeploy contract: when false, the secondary button is
    // hidden so a context that cannot act never emits a no-op that only toasts.
    actionable: {
      type: Boolean,
      default: true
    }
  })

  const emit = defineEmits(['update:visible', 'rollback', 'redeploy'])

  const toast = useToast()

  // The composable owns all drawer state; the component stays thin and only
  // surfaces fetch errors as a toast (DOM-bound concern kept out of the composable).
  const onError = (error) =>
    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail: error?.message || 'Failed to load release details'
    })

  const forward = (event, payload) => emit(event, payload)

  const {
    detail,
    isLoading,
    logs,
    impactedWorkloads,
    impactedWorkloadCount,
    isLoadingImpactedWorkloads,
    deploymentName,
    visibleDrawer,
    displayRelease,
    visitUrl,
    secondaryButtonLabel,
    onSecondaryAction
  } = useDeploymentReleaseDrawer({
    release: toRef(props, 'release'),
    visible: toRef(props, 'visible'),
    emit: (event, payload) => {
      if (event === 'error') return onError(payload)
      return forward(event, payload)
    }
  })
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="visibleDrawer"
    title="Deployment Details"
    width-class="max-w-6xl"
    :bottom-sheet-on-mobile="true"
  >
    <template #header-actions>
      <a
        v-if="visitUrl"
        :href="visitUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1 text-sm text-[var(--text-link,#3392ff)] hover:underline"
        data-testid="deployment-release-drawer__visit"
      >
        Visit
        <i
          class="pi pi-external-link text-xs"
          aria-hidden="true"
        />
      </a>
      <Button
        v-if="actionable"
        outlined
        :label="secondaryButtonLabel"
        :icon="secondaryButtonLabel === 'Rollback' ? 'pi pi-refresh' : 'pi pi-sync'"
        size="small"
        data-testid="deployment-release-drawer__secondary"
        @click="onSecondaryAction"
      />
    </template>

    <template #body>
      <div
        v-if="isLoading && !detail"
        class="flex flex-col gap-4"
        data-testid="deployment-release-drawer__skeleton"
      >
        <Skeleton
          width="100%"
          height="216px"
        />
        <Skeleton
          width="100%"
          height="48px"
        />
      </div>
      <DeploymentReleaseDetails
        v-else-if="displayRelease"
        :release="displayRelease"
        :logs="logs"
        :impacted-workloads="impactedWorkloads"
        :impacted-workloads-count="impactedWorkloadCount"
        :is-loading-impacted-workloads="isLoadingImpactedWorkloads"
        :deployment-name="deploymentName"
      />
    </template>
  </InfoDrawerBlock>
</template>
