<script setup>
  /**
   * v6 EditView — the Firewall screen, gated by `use_v6_configurations`.
   * Two outer tabs: Versions (the listing) and Settings (Main Settings of the
   * latest version; editable when `draft`, read-only otherwise).
   *
   * The flag check stays centralized in the router. Lifecycle commands bubble up
   * from MainSettingsTab; this view owns the toast + tab/route navigation.
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
  import VersionsTab from '@/views/EdgeFirewall/v6/tabs/VersionsTab.vue'
  import MainSettingsTab from '@/views/EdgeFirewall/v6/tabs/MainSettingsTab.vue'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { edgeFirewallVersionService } from '@/services/v2/edge-firewall/edge-firewall-version-service'

  defineOptions({ name: 'edge-firewall-v6-edit-view' })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const TAB = { VERSIONS: 0, SETTINGS: 1 }

  const firewallId = computed(() => String(route.params.id))

  const firewall = ref(null)
  const isLoadingFirewall = ref(true)
  const loadError = ref(null)

  provide('edgeFirewall', firewall)

  const loadFirewall = async () => {
    if (!firewall.value) isLoadingFirewall.value = true
    loadError.value = null
    try {
      firewall.value = await edgeFirewallService.loadEdgeFirewallService({ id: firewallId.value })
    } catch (err) {
      loadError.value = err
      firewall.value = null
    } finally {
      isLoadingFirewall.value = false
    }
  }

  watch(firewallId, loadFirewall, { immediate: true })

  const versionsQuery = edgeFirewallVersionService.useListVersionsQuery(firewallId.value)
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

  const latestVersionId = computed(() => {
    const list = rawVersions.value
    if (!list.length) return null
    const sorted = [...list].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    return sorted[0]?.id ?? null
  })

  const activeTab = computed({
    get: () => (String(route.params.tab) === 'settings' ? TAB.SETTINGS : TAB.VERSIONS),
    set: (index) => {
      const params = { id: firewallId.value }
      if (index === TAB.SETTINGS) params.tab = 'settings'
      router.replace({ name: 'edit-firewall', params })
    }
  })

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  const readyVersionOptions = computed(() =>
    rawVersions.value
      .filter((version) => version.state === VERSION_STATES.READY)
      .map((version) => ({
        label: version.comment || `Version ${version.id}`,
        value: version.id
      }))
  )

  const deployVersionId = computed(() =>
    activeTab.value === TAB.SETTINGS ? latestVersionId.value : null
  )
  const deployResourceContext = computed(() => ({
    resourceType: 'firewall',
    resourceId: Number(firewallId.value),
    resourceName: firewall.value?.name ?? '',
    version: deployVersionId.value ? { id: deployVersionId.value } : null,
    versions: readyVersionOptions.value
  }))

  const firewallTitle = computed(() => firewall.value?.name ?? '')
  const pageDescription =
    'Each version is an isolated snapshot of this Firewall configuration. Edit a draft, then build it to publish an immutable version to the Edge.'

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Version saved',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
    [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
    [VERSION_ACTIONS.DELETE]: 'Version deleted'
  }

  const goToVersionsList = () => {
    activeTab.value = TAB.VERSIONS
  }

  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    if (action === VERSION_ACTIONS.DEPLOY) {
      openDeployDrawer()
      return
    }

    toast.add({
      closable: true,
      severity: 'success',
      summary: SUCCESS_SUMMARY[action] ?? 'Done'
    })

    switch (action) {
      case VERSION_ACTIONS.DELETE:
        goToVersionsList()
        return
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToVersionsList()
        return
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        router.push({
          name: 'edit-firewall-version',
          params: { id: firewallId.value, versionId: result.id }
        })
        return
      case VERSION_ACTIONS.SAVE:
        loadFirewall()
        return
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
    v-if="isLoadingFirewall"
    class="flex items-center justify-center p-8"
    data-testid="edge-firewall-v6-edit__loading"
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
    data-testid="edge-firewall-v6-edit__error"
  >
    Failed to load firewall. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="edge-firewall-v6-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="firewallTitle"
        :description="pageDescription"
        :entityName="firewall?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        v-model:activeIndex="activeTab"
        :pt="{ root: { class: 'flex flex-col gap-4' } }"
      >
        <TabPanel
          header="Versions"
          :pt="{ root: { 'data-testid': 'edge-firewall-v6-edit__tab__versions' } }"
        >
          <VersionsTab
            v-if="activeTab === TAB.VERSIONS"
            :firewall-id="firewallId"
          />
        </TabPanel>
        <TabPanel
          header="Settings"
          :pt="{ root: { 'data-testid': 'edge-firewall-v6-edit__tab__settings' } }"
        >
          <template v-if="activeTab === TAB.SETTINGS">
            <MainSettingsTab
              v-if="latestVersionId"
              :key="latestVersionId"
              :firewall="firewall"
              :resource-id="firewallId"
              :version-id="latestVersionId"
              @command-success="handleCommandSuccess"
              @command-error="handleCommandError"
              @cancel="handleCancel"
            />
            <div
              v-else
              class="flex w-full flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-16 text-center text-[var(--text-color-secondary)]"
              data-testid="edge-firewall-v6-edit__settings-empty"
            >
              <i class="pi pi-file-edit text-2xl text-[var(--text-color-secondary)]" />
              <h3 class="m-0 text-base font-semibold leading-6 text-[var(--text-color)]">
                No version to edit yet
              </h3>
              <p class="m-0 max-w-md text-sm leading-6">
                Create a version on the Versions tab to start configuring this Firewall.
              </p>
              <PrimeButton
                label="New Version"
                icon="pi pi-plus"
                size="small"
                data-testid="edge-firewall-v6-edit__settings-empty__cta"
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
