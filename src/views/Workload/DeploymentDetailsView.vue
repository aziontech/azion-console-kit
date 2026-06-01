<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import Button from '@aziontech/webkit/button'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import DeploymentVersionDetails from '@/views/Deployments/components/DeploymentVersionDetails.vue'
  import { workloadService } from '@/services/v2/workload/workload-service'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'
  import {
    findWorkloadDeploymentById,
    statusTag
  } from '@/views/Workload/Tabs/sections/deployments.mock'

  defineOptions({ name: 'workload-deployment-details' })

  const route = useRoute()
  const toast = useToast()
  const breadcrumbs = useBreadcrumbs()

  const workloadId = route.params.id
  const deploymentId = route.params.deploymentId

  const cachedWorkload = workloadService.getWorkloadFromCache(workloadId) ?? null
  const workload = ref(cachedWorkload)
  const isLoadingWorkload = ref(!cachedWorkload)

  const rawDeployment = findWorkloadDeploymentById(deploymentId)

  const versionForDetails = computed(() => {
    if (!rawDeployment) return null
    return {
      ...rawDeployment,
      status: statusTag(rawDeployment.status)
    }
  })

  const workloadName = computed(() => workload.value?.name || '')

  const visitUrl = computed(
    () => rawDeployment?.urls?.deployment_url || rawDeployment?.urls?.canonical_url || ''
  )

  const secondaryButtonLabel = computed(() => (rawDeployment?.isCurrent ? 'Rollback' : 'Redeploy'))

  const pageTitle = computed(() => rawDeployment?.deploymentId || 'Deployment Details')

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

  const confirmDialog = ref({
    visible: false,
    action: null,
    loading: false
  })

  const confirmDialogTitle = computed(() =>
    confirmDialog.value.action === 'rollback' ? 'Roll back deployment' : 'Redeploy deployment'
  )

  const confirmDialogMessage = computed(() => {
    const name = rawDeployment?.deploymentId || 'this deployment'
    return confirmDialog.value.action === 'rollback'
      ? `Roll back to "${name}"? Traffic will move to the previous active version.`
      : `Redeploy "${name}"? It will become the active version for its environment.`
  })

  const onSecondaryAction = () => {
    if (!rawDeployment) return
    confirmDialog.value = {
      visible: true,
      action: rawDeployment.isCurrent ? 'rollback' : 'redeploy',
      loading: false
    }
  }

  const closeConfirmDialog = () => {
    confirmDialog.value = { visible: false, action: null, loading: false }
  }

  // TODO: wire to real service when the deployments-per-workload endpoint exists.
  const runConfirmedAction = () => {
    const { action } = confirmDialog.value
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
  }

  onMounted(() => {
    updateBreadcrumb()
    if (!cachedWorkload) fetchWorkload()
  })

  watch(workloadName, updateBreadcrumb)
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
          v-if="rawDeployment"
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
      <DeploymentVersionDetails
        v-if="versionForDetails"
        :version="versionForDetails"
      />
      <div
        v-else
        class="text-sm text-[var(--text-color-secondary)]"
        data-testid="workload-deployment-details__not-found"
      >
        Deployment not found.
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
