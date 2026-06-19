<script setup>
  import { computed, ref, watch } from 'vue'
  import Button from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useToast } from '@aziontech/webkit/use-toast'
  import InfoDrawerBlock from '@/templates/info-drawer-block/index.vue'
  import DeploymentReleaseDetails from '@/views/Deployments/components/DeploymentReleaseDetails.vue'
  import { deploymentReleaseService } from '@/services/v2/deployment/deployment-release-service'
  import { resolveReleaseResources } from '@/views/Deployments/utils/resolveReleaseResources'

  defineOptions({ name: 'deployment-release-drawer' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    release: {
      type: Object,
      default: null
    }
  })

  const emit = defineEmits(['update:visible', 'rollback', 'redeploy'])

  const toast = useToast()

  const detail = ref(null)
  const isLoading = ref(false)
  const resolvedResources = ref([])

  const displayRelease = computed(() => {
    const base = detail.value ?? props.release
    if (!base) return base
    return {
      ...base,
      resources: resolvedResources.value.length ? resolvedResources.value : (base.resources ?? [])
    }
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const visitUrl = computed(
    () =>
      displayRelease.value?.urls?.deployment_url || displayRelease.value?.urls?.canonical_url || ''
  )

  const secondaryButtonLabel = computed(() =>
    displayRelease.value?.isCurrent ? 'Rollback' : 'Redeploy'
  )

  const onSecondaryAction = () => {
    const release = displayRelease.value
    if (!release) return
    if (release.isCurrent) {
      emit('rollback', release)
    } else {
      emit('redeploy', release)
    }
  }

  const fetchDetail = async () => {
    const deploymentId = props.release?.deployment_id
    const releaseId = props.release?.id

    if (!deploymentId || !releaseId) {
      detail.value = null
      return
    }

    isLoading.value = true
    try {
      const { data } = await deploymentReleaseService.getReleaseByIdService(deploymentId, releaseId)
      detail.value = data
      resolvedResources.value = data?.resources ?? []

      const enriched = await resolveReleaseResources(data?.resources ?? [])
      if (detail.value?.id === data?.id) {
        resolvedResources.value = enriched
      }
    } catch (error) {
      detail.value = null
      resolvedResources.value = []
      toast.add({
        closable: true,
        severity: 'error',
        summary: 'Error',
        detail: error?.message || 'Failed to load release details'
      })
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => props.visible,
    (open) => {
      if (open) {
        fetchDetail()
      } else {
        detail.value = null
        resolvedResources.value = []
      }
    }
  )

  watch(
    () => props.release?.id,
    () => {
      if (props.visible) fetchDetail()
    }
  )
</script>

<template>
  <InfoDrawerBlock
    v-model:visible="visibleDrawer"
    title="Deployment Details"
    width-class="max-w-6xl"
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
      />
    </template>
  </InfoDrawerBlock>
</template>
