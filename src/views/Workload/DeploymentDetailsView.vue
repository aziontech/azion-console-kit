<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Button from '@aziontech/webkit/button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import Skeleton from '@aziontech/webkit/skeleton'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeploymentVersionDetails from '@/views/Deployments/components/DeploymentVersionDetails.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { deploymentVersionService } from '@/services/v2/deployment/deployment-version-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  defineOptions({ name: 'workload-deployment-details' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const workloadId = route.params.id
  const versionId = route.params.versionId

  const cachedWorkload = workloadService.getWorkloadFromCache(workloadId) ?? null
  const workload = ref(cachedWorkload)
  const isLoadingWorkload = ref(!cachedWorkload)

  const version = ref(null)
  const isLoadingVersion = ref(true)

  const workloadName = computed(() => workload.value?.name || '')
  const workloadDeploymentId = computed(() => workload.value?.workloadDeploymentId ?? null)

  const visitUrl = computed(
    () => version.value?.urls?.deployment_url || version.value?.urls?.canonical_url || ''
  )

  const secondaryButtonLabel = computed(() => (version.value?.isCurrent ? 'Rollback' : 'Redeploy'))

  const pageTitle = computed(() => version.value?.name || version.value?.id || 'Deployment Details')

  const updateBreadcrumb = () => {
    breadcrumbs.update([
      { label: 'Workloads', to: '/workloads' },
      {
        label: workloadName.value || null,
        to: `/workloads/edit/${workloadId}/deployment`,
        isLoading: !workloadName.value
      },
      { label: 'Deployment Details' }
    ])
  }

  const fetchWorkload = async () => {
    isLoadingWorkload.value = true
    try {
      workload.value = await workloadService.loadWorkload({ id: workloadId })
    } catch (error) {
      error?.showWithOptions?.(toast, {
        summary: 'Processing failed',
        detail: error
      })
      workload.value = {}
    } finally {
      isLoadingWorkload.value = false
    }
  }

  const fetchVersion = async () => {
    if (!workloadDeploymentId.value || !versionId) {
      version.value = null
      isLoadingVersion.value = false
      return
    }

    isLoadingVersion.value = true
    try {
      const { data } = await deploymentVersionService.getVersionByIdService(
        workloadDeploymentId.value,
        versionId
      )
      version.value = data
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load deployment version'
      })
      version.value = null
    } finally {
      isLoadingVersion.value = false
    }
  }

  const confirmDialog = ref({
    visible: false,
    action: null,
    loading: false
  })

  const confirmDialogTitle = computed(() =>
    confirmDialog.value.action === 'rollback' ? 'Roll back deployment' : 'Redeploy deployment'
  )

  const confirmDialogMessage = computed(() => {
    const name = version.value?.name || version.value?.id || 'this deployment'
    return confirmDialog.value.action === 'rollback'
      ? `Roll back to "${name}"? Traffic will move to the previous active version.`
      : `Redeploy "${name}"? It will become the active version for its environment.`
  })

  const onSecondaryAction = () => {
    if (!version.value) return
    confirmDialog.value = {
      visible: true,
      action: version.value.isCurrent ? 'rollback' : 'redeploy',
      loading: false
    }
  }

  const closeConfirmDialog = () => {
    confirmDialog.value = { visible: false, action: null, loading: false }
  }

  const runConfirmedAction = async () => {
    const { action } = confirmDialog.value
    if (!action || !workloadDeploymentId.value || !version.value?.id) return

    confirmDialog.value.loading = true
    try {
      if (action === 'rollback') {
        await deploymentVersionService.rollbackVersionService(
          workloadDeploymentId.value,
          version.value.id
        )
      } else {
        await deploymentVersionService.activateVersionService(
          workloadDeploymentId.value,
          version.value.id
        )
      }
      toast.add({
        closable: true,
        severity: 'success',
        summary: 'Success',
        detail:
          action === 'rollback'
            ? 'Rollback requested successfully'
            : 'Redeploy requested successfully'
      })
      closeConfirmDialog()
      await fetchVersion()
    } catch (error) {
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail:
          error?.message ||
          (action === 'rollback' ? 'Failed to roll back version' : 'Failed to redeploy version')
      })
      confirmDialog.value.loading = false
    }
  }

  onMounted(() => {
    updateBreadcrumb()
    if (!cachedWorkload) fetchWorkload()
  })

  watch(workloadName, updateBreadcrumb)
  watch(workloadDeploymentId, (id) => {
    if (id) fetchVersion()
  })
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="pageTitle"
        data-testid="workload-deployment-details__heading"
      >
        <a
          v-if="visitUrl"
          :href="visitUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-sm text-[var(--text-link,#3392ff)] hover:underline"
          data-testid="workload-deployment-details__visit"
        >
          Visit
          <i
            class="pi pi-external-link text-xs"
            aria-hidden="true"
          />
        </a>
        <Button
          v-if="version"
          outlined
          :label="secondaryButtonLabel"
          :icon="secondaryButtonLabel === 'Rollback' ? 'pi pi-refresh' : 'pi pi-sync'"
          size="small"
          data-testid="workload-deployment-details__secondary"
          @click="onSecondaryAction"
        />
      </PageHeadingBlock>
    </template>

    <template #content>
      <div
        v-if="isLoadingVersion || isLoadingWorkload"
        class="flex flex-col gap-4"
        data-testid="workload-deployment-details__skeleton"
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
      <DeploymentVersionDetails
        v-else-if="version"
        :version="version"
      />
      <div
        v-else
        class="text-sm text-[var(--text-color-secondary)] p-4 border border-dashed border-[var(--surface-border)] rounded-md text-center"
        data-testid="workload-deployment-details__not-found"
      >
        Deployment not found.
        <button
          type="button"
          class="ml-2 text-[var(--primary-color)] hover:underline"
          @click="router.push(`/workloads/edit/${workloadId}/deployment`)"
        >
          Back to list
        </button>
      </div>

      <PrimeDialog
        v-model:visible="confirmDialog.visible"
        modal
        :closable="!confirmDialog.loading"
        :header="confirmDialogTitle"
        class="max-w-md w-full"
        :pt="{
          headerTitle: { 'data-testid': 'workload-deployment-details__confirm-dialog__title' }
        }"
      >
        <p class="text-sm text-[var(--text-color-secondary)]">
          {{ confirmDialogMessage }}
        </p>
        <template #footer>
          <Button
            label="Cancel"
            outlined
            :disabled="confirmDialog.loading"
            @click="closeConfirmDialog"
          />
          <Button
            :label="confirmDialog.action === 'rollback' ? 'Rollback' : 'Redeploy'"
            :loading="confirmDialog.loading"
            @click="runConfirmedAction"
          />
        </template>
      </PrimeDialog>
    </template>
  </ContentBlock>
</template>
