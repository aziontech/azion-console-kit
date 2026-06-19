<script setup>
  /**
   * VersionEditView — the FULL version editor screen for Edge Firewall, gated by
   * `use_v6_configurations`. Rendered at `edit-firewall-version`. Edits ONE
   * version across Main Settings + Functions + Rules Engine via VersionEditorTabs.
   *
   * The flag check stays centralized in the router. Service injections received
   * as route props are forwarded down to the editor.
   */
  import { computed, ref, watch, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from '@aziontech/webkit/use-toast'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'

  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import VersionEditorTabs from '@/views/EdgeFirewall/v6/tabs/VersionEditorTabs.vue'

  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'

  defineOptions({ name: 'edge-firewall-v6-version-edit-view' })

  // Service injections forwarded by the router so this view stays free of direct
  // HTTP imports. Kept for parity with the Application version route.
  defineProps({
    listDomainsService: {
      type: Function,
      default: null
    }
  })

  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const firewallId = computed(() => String(route.params.id))
  const versionId = computed(() => (route.params.versionId ? String(route.params.versionId) : null))

  if (!versionId.value) {
    router.replace({ name: 'edit-firewall', params: { id: firewallId.value } })
  }

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

  const firewallTitle = computed(() => {
    const name = firewall.value?.name ?? ''
    const vid = versionId.value
    if (!name || !vid) return name
    return `${name} — Version ${vid}`
  })

  const SUCCESS_SUMMARY = {
    [VERSION_ACTIONS.SAVE]: 'Version saved',
    [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
    [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
    [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
    [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
    [VERSION_ACTIONS.DELETE]: 'Version deleted'
  }

  const editorTabsRef = ref(null)

  const goToVersionsList = () =>
    router.push({ name: 'edit-firewall', params: { id: firewallId.value } })

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
    data-testid="edge-firewall-v6-version-edit__loading"
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
    data-testid="edge-firewall-v6-version-edit__error"
  >
    Failed to load firewall. Try refreshing the page.
  </InlineMessage>

  <ContentBlock
    v-else
    data-testid="edge-firewall-v6-version-edit"
  >
    <template #heading>
      <PageHeadingBlock
        :pageTitle="firewallTitle"
        :entityName="firewall?.name"
      >
        <template #default>
          <div class="flex items-center gap-3">
            <div
              id="version-tab-add-action"
              class="flex items-center"
            />
            <div
              id="version-lifecycle-action"
              class="flex items-center"
            />
          </div>
        </template>
      </PageHeadingBlock>
    </template>
    <template #content>
      <VersionEditorTabs
        v-if="versionId"
        ref="editorTabsRef"
        :key="versionId"
        :firewall="firewall"
        :resource-id="firewallId"
        :version-id="versionId"
        @command-success="handleCommandSuccess"
        @command-error="handleCommandError"
        @cancel="handleCancel"
      />
    </template>
  </ContentBlock>
</template>
