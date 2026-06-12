<script setup>
  import { computed, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import TabView from 'primevue/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'

  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionShell from '@/templates/version-shell-block/index.vue'
  import ApplicationVersionBadge from '@/views/EdgeApplications/v6/ApplicationVersionBadge.vue'
  import ApplicationVersionAdapter from '@/views/EdgeApplications/v6/ApplicationVersionAdapter.vue'
  import FormFieldsEditEdgeApplications from '@/views/EdgeApplications/FormFields/FormFieldsEditEdgeApplications.vue'

  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'edge-applications-v6-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const edgeApplicationId = computed(() => String(route.params.id))
  const versionId = computed(() => (route.params.versionId ? String(route.params.versionId) : null))

  // Guard req 4.4: without versionId there is no version to edit. Redirects to
  // the versions list (route `edit-application`, which under the v6 flag renders
  // VersionsListView). The redirect runs in setup; the `v-if="versionId"` in the
  // template prevents the shell/badge/query from mounting in this transient state.
  if (!versionId.value) {
    router.replace({ name: 'edit-application', params: { id: edgeApplicationId.value } })
  }
  const application = ref(null)
  const isLoadingApplication = ref(true)
  const loadError = ref(null)

  const loadApplication = async () => {
    // Global spinner only on initial load: on re-loads (e.g. post-SAVE, to
    // reflect the new name in the title) the screen stays mounted — tearing down
    // the ContentBlock would unmount shell/form and lose the tabs state.
    if (!application.value) isLoadingApplication.value = true
    loadError.value = null
    try {
      const result = await edgeAppService.loadEdgeApplicationService({
        id: edgeApplicationId.value
      })
      application.value = result
    } catch (err) {
      loadError.value = err
      application.value = null
    } finally {
      isLoadingApplication.value = false
    }
  }

  watch(edgeApplicationId, loadApplication, { immediate: true })

  const activeTabIndex = ref(0)

  const applicationTabs = computed(() => {
    if (!application.value || !versionId.value) return []

    return [
      {
        key: 'main-settings',
        label: 'Main Settings',
        // v4 workspace form: fields connected via useField to the useForm in
        // ApplicationVersionAdapter. Default `handleBlock: ['full']` renders
        // all blocks — without legacy V3 delivery/TLS props.
        component: FormFieldsEditEdgeApplications,
        props: {}
      }
    ]
  })

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
  }

  // Versions list of this Application (route `edit-application`, which under the
  // v6 flag renders VersionsListView). Used by Cancel and by the actions that
  // leave the edit screen (DELETE, SAVE_AND_BUILD).
  const goToVersionsList = () =>
    router.push({ name: 'edit-application', params: { id: edgeApplicationId.value } })

  // Cancel emitted by VersionShell: discards the edit and returns to the listing.
  // It is not a lifecycle command, so there is no toast and no cache mutation.
  const handleCancel = () => goToVersionsList()

  // Command success emitted by VersionShell (`{ action, result }`).
  // Shows toast and decides navigation/reload per action.
  const handleCommandSuccess = ({ action, result }) => {
    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Done'
    })

    switch (action) {
      // DELETE removes the version — goes back to the versions list (req 4.1).
      case VERSION_ACTIONS.DELETE:
        goToVersionsList()
        return
      // SAVE_AND_BUILD does no polling here: the build progress can be
      // checked in the versions list, so we navigate there (req 4.5).
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToVersionsList()
        return
      // NEW_DRAFT_FROM creates a new draft — opens the edit screen for that new version (req 4.2).
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        router.push({
          name: 'edit-application-version',
          params: { id: edgeApplicationId.value, versionId: result.id }
        })
        return
      // SAVE stays on the screen; the name may have changed and feeds the title,
      // so it reloads the Application (the view stays mounted — req 4.3).
      case VERSION_ACTIONS.SAVE:
        loadApplication()
        return
      // Other actions (e.g. ARCHIVE/CANCEL_BUILD) stay on the screen without reload (req 4.3).
      default:
    }
  }

  // Command failure emitted by VersionShell (`{ action, error }`).
  // Extracts the message following the repo pattern (error.showErrors when
  // available; otherwise message/string; generic fallback).
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

  // Factory passed to VersionShell. Defined in setup (not inline in the template)
  // because, inside template function literals, refs are not auto-unwrapped
  // — they require an explicit `.value`.
  const useVersionQuery = () =>
    edgeAppVersionService.useLoadVersionQuery(edgeApplicationId.value, versionId.value)
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
        :entityName="application?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <!-- Keyed by versionId: the canonical query uses a static queryKey,
                 so an in-place version switch requires remounting the badge. -->
            <ApplicationVersionBadge
              v-if="versionId"
              :key="versionId"
              :resource-id="edgeApplicationId"
              :version-id="versionId"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <!-- Keyed by versionId: the shell calls the query factory only once
           in setup and useVersionShell captures resourceId/versionId by value.
           In-place navigation to another version (post-NEW_DRAFT_FROM) needs to
           remount shell + adapter to renew query, ctx and form. -->
      <VersionShell
        v-if="versionId"
        :key="versionId"
        :use-version-query="useVersionQuery"
        :resource-id="edgeApplicationId"
        :version-id="versionId"
        data-testid="edge-applications-v6-edit__shell"
        @updated="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      >
        <ApplicationVersionAdapter
          :application="application"
          :resource-id="edgeApplicationId"
          :version-id="versionId"
        >
          <TabView v-model:activeIndex="activeTabIndex">
            <TabPanel
              v-for="tab in applicationTabs"
              :key="tab.key"
              :header="tab.label"
              :pt="{
                root: { 'data-testid': `edge-applications-v6-edit__tab-panel__${tab.key}` }
              }"
            >
              <div class="flex flex-col gap-4 mt-4">
                <component
                  :is="tab.component"
                  v-bind="tab.props ?? {}"
                />
              </div>
            </TabPanel>
          </TabView>
        </ApplicationVersionAdapter>
      </VersionShell>
    </template>
  </ContentBlock>
</template>
