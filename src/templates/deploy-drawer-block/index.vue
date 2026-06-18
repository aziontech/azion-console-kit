<script setup>
  /**
   * deploy-drawer-block — reusable shell of the Deploy/Release drawer
   * (design §3.1). Replaces the former per-resource placeholder with a generic
   * block driven solely by `resourceContext`: it knows nothing about Edge
   * Application, so Firewall/Connectors can reuse it by passing their context.
   *
   * It composes the `empty-drawer` shell with progressive reveal of the three
   * steps (workload → environment → resource+version) and a single confirm
   * action. All data orchestration, derivations and the one-shot release
   * dispatch live in `useDeployDrawer`; this component only renders and wires
   * UI state. Zero HTTP, zero business logic, no `user-flag` import (the
   * `use_v6_configurations` flag stays centralized in the router — req 7.3,
   * design §6.1).
   */
  import { computed, ref } from 'vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  import EmptyDrawer from '@/templates/empty-drawer'
  import { useDeployDrawer } from '@/composables/deploy/use-deploy-drawer'

  import WorkloadSelectField from '@/templates/deploy-drawer-block/components/WorkloadSelectField.vue'
  import EnvironmentSelectionInput from '@/templates/deploy-drawer-block/components/EnvironmentSelectionInput.vue'
  import ResourceVersionField from '@/templates/deploy-drawer-block/components/ResourceVersionField.vue'

  defineOptions({ name: 'deploy-drawer-block' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    /**
     * Origin resource seam (design §5.1) — the ONLY resource-specific input.
     * `{ resourceType, resourceId, resourceName, version, versions }`.
     */
    resourceContext: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['update:visible', 'deployed'])

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const toast = useToast()

  const {
    isLoading,
    hasError,
    refetch,
    workloadOptions,
    selectedWorkloadId,
    workloadHasBindings,
    environmentCards,
    selectedEnvironmentId,
    resourceName,
    versionOptions,
    selectedVersionId,
    canDeploy,
    isDeploying,
    deployError,
    deploy
  } = useDeployDrawer(() => props.resourceContext, { visible: isVisible })

  const versionInvalid = ref(false)

  const surfaceDeployError = (error) => {
    if (error && typeof error.showErrors === 'function') {
      error.showErrors(toast)
      return
    }

    const detail = error?.message ?? (typeof error === 'string' ? error : 'Something went wrong')

    toast.add({
      closable: true,
      severity: 'error',
      summary: 'Error',
      detail
    })
  }

  const onDeploy = async () => {
    if (!selectedVersionId.value) {
      versionInvalid.value = true
      return
    }

    versionInvalid.value = false

    try {
      await deploy()
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Deploy triggered'
      })
      emit('deployed')
      isVisible.value = false
    } catch (error) {
      surfaceDeployError(deployError.value ?? error)
    }
  }
</script>

<template>
  <EmptyDrawer
    v-model:visible="isVisible"
    title="Deploy"
    data-testid="deploy-drawer"
  >
    <template #content>
      <div
        v-if="isLoading"
        class="flex w-full items-center justify-center py-16"
        data-testid="deploy-drawer__loading"
      >
        <ProgressSpinner
          class="w-10 h-10 text-color"
          strokeWidth="4"
        />
      </div>

      <div
        v-else-if="hasError"
        class="flex w-full flex-col items-start gap-3"
        data-testid="deploy-drawer__error"
      >
        <InlineMessage
          class="w-full"
          severity="error"
        >
          Failed to load deploy data. Try again.
        </InlineMessage>
        <PrimeButton
          label="Retry"
          icon="pi pi-refresh"
          size="small"
          outlined
          data-testid="deploy-drawer__retry"
          @click="refetch"
        />
      </div>

      <div
        v-else
        class="flex w-full flex-col gap-6"
        data-testid="deploy-drawer__content"
      >
        <WorkloadSelectField
          v-model="selectedWorkloadId"
          :options="workloadOptions"
        />

        <InlineMessage
          v-if="selectedWorkloadId && !workloadHasBindings"
          class="w-full"
          severity="warn"
          data-testid="deploy-drawer__no-bindings"
        >
          This workload has no deployable environments.
        </InlineMessage>

        <EnvironmentSelectionInput
          v-if="selectedWorkloadId && workloadHasBindings"
          v-model="selectedEnvironmentId"
          :environments="environmentCards"
        />

        <ResourceVersionField
          v-if="selectedEnvironmentId"
          v-model="selectedVersionId"
          :resource-name="resourceName"
          :versions="versionOptions"
          :invalid="versionInvalid"
        />
      </div>
    </template>

    <template #footer>
      <div
        class="flex w-full justify-end gap-3 border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-8 py-4"
      >
        <PrimeButton
          label="Deploy"
          icon="pi pi-cloud-upload"
          size="small"
          :disabled="!canDeploy"
          :loading="isDeploying"
          data-testid="deploy-drawer__confirm"
          @click="onDeploy"
        />
      </div>
    </template>
  </EmptyDrawer>
</template>
