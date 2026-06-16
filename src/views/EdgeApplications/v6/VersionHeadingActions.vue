<script setup>
  /**
   * VersionHeadingActions — the version summary surfaced in the v6 EditView page
   * heading, beside the title. Two lines:
   *
   *   line 1 → version StatusTag + the primary lifecycle action
   *            (Build while draft / Deploy while ready)
   *   line 2 → "Created <date> · by <author>"
   *
   * Replaces the standalone ApplicationVersionBadge: the StatusTag here is the
   * single state indicator in the heading.
   *
   *  - draft  → "Build"  dispatches SAVE_AND_BUILD (persists the open form, then
   *             builds; disabled while the form is invalid).
   *  - ready  → "Deploy" opens the reusable deploy-drawer-block with this version
   *             pre-filled as the release source (req 4.1, 4.2).
   *
   * MUST render INSIDE the VersionShell slot so `useVersionContext()` injects the
   * real `state`/`version`/`disabledActions`/`dispatch`. Its DOM is Teleported into
   * the page heading (target `#version-lifecycle-action`) — same pattern as
   * VersionTabAddButton. Build dispatches through the shell's `dispatch`
   * (= handleDispatch), so success/error reach EditView's `@updated`/
   * `@command-error` handlers (toast + navigation), like the footer action bar.
   */
  import { computed, ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import StatusTag from '@/components/StatusTag'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import {
    VERSION_ACTIONS,
    VERSION_STATES,
    mapVersionStateToStatus
  } from '@/composables/versioning/version-machine'
  import { formatExhibitionDate } from '@/helpers/convert-date'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  defineOptions({ name: 'version-heading-actions' })

  const route = useRoute()
  const { state, version, disabledActions, dispatch } = useVersionContext()

  // Origin resource for the deploy drawer. EditView (our ancestor) already
  // `provide`s the loaded Application ref; the route id is a fallback for mounts
  // where the provide is absent (e.g. stories). `resourceId` is the numeric
  // Application id; `resourceName` feeds `resources[].name` in the release payload.
  const edgeApplication = inject('edgeApplication', ref(null))
  const resourceId = computed(() => Number(edgeApplication.value?.id ?? route.params.id))
  const resourceName = computed(() => edgeApplication.value?.name ?? '')

  const statusTag = computed(() => mapVersionStateToStatus(state.value))

  const showBuild = computed(() => state.value === VERSION_STATES.DRAFT)
  const showDeploy = computed(() => state.value === VERSION_STATES.READY)

  // SAVE_AND_BUILD is gated by form validity: the shell flags it in `disabledActions`
  // (the handler's `ready` ref) whenever the Main Settings form is invalid.
  const isBuildDisabled = computed(() =>
    disabledActions.value.includes(VERSION_ACTIONS.SAVE_AND_BUILD)
  )

  const handleBuild = () => dispatch(VERSION_ACTIONS.SAVE_AND_BUILD, {})

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  // Deployable versions for the drawer. Reuses the same `useListVersionsQuery`
  // (deduped by queryKey with EditView/VersionsTab) so the user can switch the
  // pre-filled version (req 4.4). Only `ready` versions are deployable, mapped to
  // the block's `{ label, value }` shape where `value` is the version_id (ULID).
  const versionsQuery = edgeAppVersionService.useListVersionsQuery(resourceId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])
  const readyVersionOptions = computed(() =>
    rawVersions.value
      .filter((item) => item.state === VERSION_STATES.READY)
      .map((item) => ({
        label: item.comment || `Version ${item.id}`,
        value: item.id
      }))
  )

  // The current version is always a valid option (it is `ready` to reach Deploy).
  // Fall back to a single-item list when the query has not resolved yet, so the
  // pre-filled version still renders without the full listing.
  const versionOptions = computed(() => {
    if (readyVersionOptions.value.length) return readyVersionOptions.value
    if (!version.value?.id) return []
    return [
      {
        label: version.value.comment || `Version ${version.value.id}`,
        value: version.value.id
      }
    ]
  })

  // Triggered from editing a `ready` version → pre-fill that version (req 4.1, 4.2).
  // `version` carries the version_id (ULID) as `id`; the drawer reads
  // `resourceContext.version.id` for the prefill.
  const deployResourceContext = computed(() => ({
    resourceType: 'application',
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    version: version.value?.id ? { id: version.value.id } : null,
    versions: versionOptions.value
  }))

  // "Created Jun 10, 2026 · by guilherme.santana@azion.com". `createdAt`/`lastEditor`
  // come from the version adapter; there is no dedicated "creator" field, so we use
  // the same `lastEditor || azion@azion.com` fallback the versions list uses.
  const createdAtLabel = computed(() =>
    version.value?.createdAt ? formatExhibitionDate(version.value.createdAt, 'medium') : null
  )
  const author = computed(() => version.value?.lastEditor || 'azion@azion.com')
  const createdInfo = computed(() => {
    const by = `by ${author.value}`
    return createdAtLabel.value ? `Created ${createdAtLabel.value} · ${by}` : by
  })
</script>

<template>
  <Teleport to="#version-lifecycle-action">
    <div class="flex flex-col items-end gap-2">
      <div class="flex items-center gap-4">
        <StatusTag :status="statusTag" />
        <PrimeButton
          v-if="showBuild"
          label="Build"
          icon="pi pi-cog"
          size="small"
          :disabled="isBuildDisabled"
          data-testid="edge-applications-v6-edit__build"
          @click="handleBuild"
        />
        <PrimeButton
          v-else-if="showDeploy"
          label="Deploy"
          icon="pi pi-cloud-upload"
          size="small"
          data-testid="edge-applications-v6-edit__deploy"
          @click="openDeployDrawer"
        />
      </div>
      <span
        class="text-xs text-[var(--text-color-secondary)]"
        data-sentry-mask
        data-testid="edge-applications-v6-edit__version-info"
      >
        {{ createdInfo }}
      </span>
    </div>
  </Teleport>

  <DeployDrawerBlock
    v-model:visible="isDeployDrawerOpen"
    :resource-context="deployResourceContext"
  />
</template>
