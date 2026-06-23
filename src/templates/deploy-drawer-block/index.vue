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
  import { useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'

  import EmptyDrawer from '@/templates/empty-drawer'
  import { useDeployDrawer } from '@/composables/deploy/use-deploy-drawer'

  import PromotionContextBanner from '@/templates/deploy-drawer-block/components/PromotionContextBanner.vue'
  import WorkloadSelectField from '@/templates/deploy-drawer-block/components/WorkloadSelectField.vue'
  import EnvironmentSelectionInput from '@/templates/deploy-drawer-block/components/EnvironmentSelectionInput.vue'
  import ReleaseCompositionField from '@/templates/deploy-drawer-block/components/ReleaseCompositionField.vue'
  import CanaryStrategyField from '@/templates/deploy-drawer-block/components/CanaryStrategyField.vue'

  defineOptions({ name: 'deploy-drawer-block' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    resourceContext: {
      type: Object,
      required: false,
      default: () => ({})
    },
    preselectedWorkloadId: {
      type: [String, Number],
      default: null
    },
    lockWorkload: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'New Release'
    }
  })

  const emit = defineEmits(['update:visible', 'deployed'])

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const toast = useToast()
  const router = useRouter()

  const onBindEnvironment = () => {
    if (!selectedWorkloadId.value) return
    const { href } = router.resolve(`/workloads/edit/${selectedWorkloadId.value}`)
    window.open(href, '_blank', 'noopener')
  }

  const onCreateApplication = () => {
    const { href } = router.resolve({ name: 'create-application' })
    window.open(href, '_blank', 'noopener')
  }

  const {
    isLoading,
    hasError,
    refetch,
    workloadOptions,
    selectedWorkloadId,
    selectedWorkloadName,
    isLoadingBindings,
    environmentCards,
    selectedEnvironmentId,
    selectedDeploymentName,
    resourceName,
    scopedType,
    isScopedApplication,
    hasScopedResource,
    versionOptions,
    selectedVersionId,
    noApplication,
    applicationReadOnly,
    activeReleaseApplication,
    applicationName,
    isResolvingApplicationName,
    applicationOptions,
    isLoadingApplications,
    selectedApplicationId,
    applicationVersions,
    isLoadingApplicationVersions,
    selectedApplicationVersionId,
    readOnlyResources,
    isResolvingReadOnlyNames,
    editableResourceCards,
    setEditableResourceId,
    setEditableResourceVersion,
    setCanaryEnabled,
    setCanaryForm,
    canDeploy,
    isDeploying,
    deployError,
    deploy
  } = useDeployDrawer(() => props.resourceContext, {
    visible: isVisible,
    preselectedWorkloadId: () => props.preselectedWorkloadId
  })

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
    if (!canDeploy.value) {
      versionInvalid.value = true
      return
    }

    versionInvalid.value = false

    try {
      await deploy()
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Release started'
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
    :title="title"
    data-testid="deploy-drawer"
  >
    <template #content>
      <div
        v-if="isLoading"
        class="flex w-full items-center justify-center py-[var(--spacing-16)]"
        data-testid="deploy-drawer__loading"
      >
        <ProgressSpinner
          class="w-10 h-10 text-[var(--text-color)]"
          strokeWidth="4"
        />
      </div>
      <div
        v-else-if="hasError"
        class="flex w-full flex-col items-start gap-[var(--spacing-3)]"
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

      <!-- 3. Progressive reveal of the configuration steps. -->
      <div
        v-else
        class="flex w-full flex-col gap-[var(--spacing-6)]"
        data-testid="deploy-drawer__content"
      >
        <PromotionContextBanner
          v-if="hasScopedResource"
          :resource-context="resourceContext"
        />
        <WorkloadSelectField
          v-model="selectedWorkloadId"
          :options="workloadOptions"
          :disabled="lockWorkload"
        />

        <EnvironmentSelectionInput
          v-if="selectedWorkloadId"
          v-model="selectedEnvironmentId"
          :environments="environmentCards"
          :workload-name="selectedWorkloadName"
          :resource-name="resourceName"
          :loading="isLoadingBindings"
          @bind="onBindEnvironment"
        />
        <ReleaseCompositionField
          v-if="selectedEnvironmentId"
          :deployment-name="selectedDeploymentName"
          :no-application="noApplication"
          :application-read-only="applicationReadOnly"
          :active-release-application="activeReleaseApplication"
          :application-name="applicationName"
          :application-options="applicationOptions"
          :is-loading-applications="isLoadingApplications"
          :selected-application-id="selectedApplicationId"
          :application-versions="applicationVersions"
          :is-loading-application-versions="isLoadingApplicationVersions"
          :selected-application-version-id="selectedApplicationVersionId"
          :is-scoped-application="isScopedApplication"
          :has-scoped-resource="hasScopedResource"
          :scoped-type="scopedType"
          :resource-name="resourceName"
          :version-options="versionOptions"
          :selected-version-id="selectedVersionId"
          :read-only-resources="readOnlyResources"
          :editable-resources="editableResourceCards"
          :is-resolving-application-name="isResolvingApplicationName"
          :is-resolving-read-only-names="isResolvingReadOnlyNames"
          :invalid="versionInvalid"
          @update:selected-application-id="selectedApplicationId = $event"
          @update:selected-application-version-id="selectedApplicationVersionId = $event"
          @update:selected-version-id="selectedVersionId = $event"
          @update:resource-id="setEditableResourceId($event.key, $event.value)"
          @update:resource-version="setEditableResourceVersion($event.key, $event.value)"
          @create-application="onCreateApplication"
        />
        <CanaryStrategyField
          v-if="selectedEnvironmentId"
          @update:enabled="setCanaryEnabled"
          @update:form="setCanaryForm"
        />
      </div>
    </template>

    <template #footer>
      <div
        class="flex w-full items-center justify-between gap-[var(--spacing-3)] border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-8)] py-[var(--spacing-4)]"
      >
        <span
          class="flex items-center gap-[var(--spacing-2)] text-body-xs text-[var(--text-color-secondary)]"
          data-testid="deploy-drawer__footer-note"
        >
          <i class="pi pi-info-circle" />
          build & activate creates, builds and activates in one action.
        </span>
        <div class="flex items-center gap-[var(--spacing-3)]">
          <PrimeButton
            label="Cancel"
            size="small"
            outlined
            data-testid="deploy-drawer__cancel"
            @click="isVisible = false"
          />
          <PrimeButton
            label="Build & activate"
            icon="pi pi-cloud-upload"
            size="small"
            :disabled="!canDeploy"
            :loading="isDeploying"
            data-testid="deploy-drawer__confirm"
            @click="onDeploy"
          />
        </div>
      </div>
    </template>
  </EmptyDrawer>
</template>
