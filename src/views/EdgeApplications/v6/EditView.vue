<script setup>
  /**
   * v6 EditView — the Application screen, gated by `use_v6_configurations`.
   * Two outer tabs: Versions (the listing) and Settings (Main Settings of the
   * latest version; editable when `draft`, read-only otherwise).
   *
   * The flag check stays centralized in the router (req 10.1) — this view never
   * imports user-flag. Lifecycle commands bubble up from MainSettingsTab; this
   * view owns the toast + tab/route navigation.
   */
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PrimeButton from '@aziontech/webkit/button'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import { VERSION_ACTIONS, VERSION_STATES } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionsTab from '@/views/EdgeApplications/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/EdgeApplications/v6/tabs/MainSettingsTab.vue'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const TAB = { VERSIONS: 0, SETTINGS: 1 }

  const edgeApplicationId = computed(() => String(route.params.id))

  const application = ref(null)
  const isLoadingApplication = ref(true)
  const loadError = ref(null)

  // Origins Drawer (mounted inside the Main Settings form, when present) injects
  // `edgeApplication` to gate the "Load Balancer" origin type. The v6 flow bypasses
  // the legacy TabsView, so we reproduce the provide here.
  provide('edgeApplication', application)

  const loadApplication = async () => {
    // Global spinner only on initial load: on re-loads (e.g. post-SAVE, to reflect
    // the new name in the title) the screen stays mounted so the tabs state holds.
    if (!application.value) isLoadingApplication.value = true
    loadError.value = null
    try {
      application.value = await edgeAppService.loadEdgeApplicationService({
        id: edgeApplicationId.value
      })
    } catch (err) {
      loadError.value = err
      application.value = null
    } finally {
      isLoadingApplication.value = false
    }
  }

  watch(edgeApplicationId, loadApplication, { immediate: true })

  // Versions of this Application. Deduped by queryKey with VersionsTab's own query,
  // so listing in both places issues a single request. Used to resolve the
  // "latest created" version the Settings tab edits.
  const versionsQuery = edgeAppVersionService.useListVersionsQuery(edgeApplicationId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  // "Latest created" = most recent `createdAt`. The list is small; a copy-sort
  // keeps it pure. Missing dates coerce to '' so the ordering stays stable.
  const latestVersionId = computed(() => {
    const list = rawVersions.value
    if (!list.length) return null
    const sorted = [...list].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    return sorted[0]?.id ?? null
  })

  const activeTab = ref(TAB.VERSIONS)

  // Deploy drawer. The heading "Deploy" action only toggles it.
  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  // Version options offered by the drawer: only `ready` versions are deployable,
  // mapped to the reusable block's `{ label, value }` shape where `value` is the
  // version_id (ULID). Comment is the human label; we fall back to `Version <id>`
  // when a version carries no comment.
  const readyVersionOptions = computed(() =>
    rawVersions.value
      .filter((version) => version.state === VERSION_STATES.READY)
      .map((version) => ({
        label: version.comment || `Version ${version.id}`,
        value: version.id
      }))
  )

  // Triggered from the Versions listing context → no source version: the version
  // field starts EMPTY for manual selection (req 4.3). `resourceId` is the numeric
  // Application id; `resourceName` feeds `resources[].name` in the release payload.
  const deployResourceContext = computed(() => ({
    resourceType: 'application',
    resourceId: Number(edgeApplicationId.value),
    resourceName: application.value?.name ?? '',
    version: null,
    versions: readyVersionOptions.value
  }))

  const applicationTitle = computed(() => application.value?.name ?? '')
  const pageDescription =
    "Each version is an isolated snapshot of this Application's configuration. Edit a draft, then build it to publish an immutable version to the Edge."

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Version saved',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
    [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
    [VERSION_ACTIONS.DELETE]: 'Version deleted',
    [VERSION_ACTIONS.DEPLOY]: 'Deploy triggered'
  }

  // Returns to the Versions tab. The Settings tab targets the latest version, with
  // no versionId in the URL, so this is a pure tab switch (no navigation).
  const goToVersionsList = () => {
    activeTab.value = TAB.VERSIONS
  }

  const handleCancel = () => goToVersionsList()

  // Command success emitted by MainSettingsTab (`{ action, result }`): toast + nav.
  const handleCommandSuccess = ({ action, result }) => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Done'
    })

    switch (action) {
      // The version is gone — back to the listing (req 4.1).
      case VERSION_ACTIONS.DELETE:
        goToVersionsList()
        return
      // No polling here: build progress is visible in the listing (req 4.5).
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToVersionsList()
        return
      // A new draft was forked — open its FULL editor (req 4.2).
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        router.push({
          name: 'edit-application-version',
          params: { id: edgeApplicationId.value, versionId: result.id }
        })
        return
      // Name may have changed and feeds the title — reload, staying here (req 4.3).
      case VERSION_ACTIONS.SAVE:
        loadApplication()
        return
      // ARCHIVE / CANCEL_BUILD / DEPLOY stay on the screen without reload (req 4.3).
      default:
    }
  }

  const handleCommandError = ({ error }) => {
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
</script>

<template>
  <div
    v-if="isLoadingApplication"
    class="flex items-center justify-center p-8"
    data-testid="edge-applications-v6-edit__loading"
  >
    <ProgressSpinner
      class="w-10 h-10 text-color"
      strokeWidth="4"
    />
  </div>

  <InlineMessage
    v-else-if="loadError"
    class="w-full"
    severity="error"
    data-testid="edge-applications-v6-edit__error"
  >
    Failed to load application. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="edge-applications-v6-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="applicationTitle"
        :description="pageDescription"
        :entityName="application?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <!-- Deploy belongs to the listing context; the Settings tab surfaces
                 the version's own Build/Deploy via VersionHeadingActions. -->
            <PrimeButton
              v-if="activeTab === TAB.VERSIONS"
              label="Deploy"
              icon="pi pi-cloud-upload"
              size="small"
              data-testid="edge-applications-v6-edit__deploy"
              @click="openDeployDrawer"
            />
            <!-- Teleport target for the version's status + lifecycle action on the
                 Settings tab (Build when draft / Deploy when ready). -->
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <!-- flex-column gap spaces the tab selector from the panel content. -->
      <TabView
        v-model:activeIndex="activeTab"
        :pt="{ root: { class: 'flex flex-col gap-4' } }"
      >
        <TabPanel
          header="Versions"
          :pt="{ root: { 'data-testid': 'edge-applications-v6-edit__tab__versions' } }"
        >
          <VersionsTab
            v-if="activeTab === TAB.VERSIONS"
            :application-id="edgeApplicationId"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'edge-applications-v6-edit__tab__settings' } }"
        >
          <!-- v-if gates mounting to the active tab so the shell (and its teleported
               heading/footer actions) only exist while Settings is open. -->
          <template v-if="activeTab === TAB.SETTINGS">
            <!-- Keyed by versionId: the shell captures resourceId/versionId by
                 value, so a version switch remounts shell + adapter + form. -->
            <MainSettingsTab
              v-if="latestVersionId"
              :key="latestVersionId"
              :application="application"
              :resource-id="edgeApplicationId"
              :version-id="latestVersionId"
              @command-success="handleCommandSuccess"
              @command-error="handleCommandError"
              @cancel="handleCancel"
            />
            <!-- No version to edit: the canonical create CTA lives on the Versions
                 tab (with the full empty state), so route the user there. -->
            <div
              v-else
              class="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-16 text-center text-[var(--text-color-secondary)]"
              data-testid="edge-applications-v6-edit__settings-empty"
            >
              <i class="pi pi-file-edit text-2xl text-[var(--text-color-secondary)]" />
              <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
                No version to edit yet
              </h3>
              <p class="m-0 max-w-md text-sm leading-6">
                Create a version on the Versions tab to start configuring this Application.
              </p>
              <PrimeButton
                label="New Version"
                icon="pi pi-plus"
                size="small"
                data-testid="edge-applications-v6-edit__settings-empty__cta"
                @click="activeTab = TAB.VERSIONS"
              />
            </div>
          </template>
        </TabPanel>
      </TabView>

      <DeployDrawerBlock
        v-model:visible="isDeployDrawerOpen"
        :resource-context="deployResourceContext"
      />
    </template>
  </ContentBlock>
</template>
