<script setup>
  /**
   * VersionEditView — the FULL version editor screen, gated by `use_v6_configurations`.
   *
   * Rendered at `edit-application-version` (`/applications/edit/:id/versions/:versionId`),
   * reached by clicking a version in the listing (or after create/clone/new-draft).
   * Edits ONE specific version across every configuration tab (Main Settings, Cache,
   * Device Groups, Functions, Rules Engine) via VersionEditorTabs.
   *
   * The Application's quick "Settings" tab (EditView → MainSettingsTab) edits only
   * Main Settings of the latest version; THIS screen is the complete editor for any
   * version. The flag check stays centralized in the router (req 10.1).
   */
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionEditorTabs from '@/views/EdgeApplications/v6/tabs/VersionEditorTabs.vue'

  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'

  defineOptions({ name: 'edge-applications-v6-version-edit-view' })

  // Legacy origins service injected by the router so this view stays free of
  // direct HTTP imports (azion-architecture/no-direct-http-in-components).
  // Forwarded to the versioned Rules tab.
  const props = defineProps({
    listOriginsService: {
      type: Function,
      default: null
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const edgeApplicationId = computed(() => String(route.params.id))
  const versionId = computed(() => (route.params.versionId ? String(route.params.versionId) : null))

  // Guard: without a versionId there is no version to edit — go to the listing.
  if (!versionId.value) {
    router.replace({ name: 'edit-application', params: { id: edgeApplicationId.value } })
  }

  const application = ref(null)
  const isLoadingApplication = ref(true)
  const loadError = ref(null)

  // Origins Drawer (mounted inside the Rules form) injects `edgeApplication` to gate
  // the "Load Balancer" origin type — see EditView for the full rationale.
  provide('edgeApplication', application)

  const loadApplication = async () => {
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

  const applicationTitle = computed(() => {
    const name = application.value?.name ?? ''
    const vid = versionId.value
    if (!name || !vid) return name
    return `${name} — Version ${vid}`
  })

  // Action → success toast summary map (constants, never loose strings).
  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Version saved',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
    [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
    [VERSION_ACTIONS.DELETE]: 'Version deleted'
    // DEPLOY has no toast: the footer Deploy action opens the deploy drawer owned
    // by VersionHeadingActions (handled in handleCommandSuccess), matching the
    // heading Deploy button.
  }

  // Ref to the editor body → VersionHeadingActions, so the VersionShell footer
  // DEPLOY can open the SAME deploy drawer the heading Deploy uses (no 2nd drawer).
  const editorTabsRef = ref(null)

  const goToVersionsList = () =>
    router.push({ name: 'edit-application', params: { id: edgeApplicationId.value } })

  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    if (action === VERSION_ACTIONS.DEPLOY) {
      editorTabsRef.value?.openDeployDrawer()
      return
    }

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
      // A new draft was created — open its full editor (req 4.2).
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
    data-testid="edge-applications-v6-version-edit__loading"
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
    data-testid="edge-applications-v6-version-edit__error"
  >
    Failed to load application. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="edge-applications-v6-version-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="applicationTitle"
        :entityName="application?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <!-- Teleport target for the active sub-tab's "+ Add" button. -->
            <div
              id="version-tab-add-action"
              class="flex items-center"
            />
            <!-- Teleport target for the version's status + lifecycle action
                 (Build when draft / Deploy when ready) — see VersionHeadingActions. -->
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <!-- Keyed by versionId: the shell captures resourceId/versionId by value, so
           an in-place version switch (post-NEW_DRAFT_FROM) remounts the editor. -->
      <VersionEditorTabs
        v-if="versionId"
        ref="editorTabsRef"
        :key="versionId"
        :application="application"
        :resource-id="edgeApplicationId"
        :version-id="versionId"
        :list-origins-service="props.listOriginsService"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ContentBlock>
</template>
