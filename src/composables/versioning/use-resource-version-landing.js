import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@aziontech/webkit/use-toast'
import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'
import { toDeployableVersionOptions } from '@/composables/versioning/to-version-options'

export const LANDING_TAB = { VERSIONS: 0, SETTINGS: 1 }

const SUCCESS_SUMMARY = {
  [VERSION_ACTIONS.SAVE]: 'Version saved',
  [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
  [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
  [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
  [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
  [VERSION_ACTIONS.DELETE]: 'Version deleted'
}

/**
 * useResourceVersionLanding — the shared logic for the TABBED landing screen
 * (Versions listing + Settings = Main Settings of the latest version), used by
 * Custom Pages and Firewall. Owns: resource load + provide, the latest-version
 * resolver, the route-driven active tab, the deploy drawer + its resourceContext
 * (via the shared version-option mapper), toast + navigation, and the
 * command-success/error handlers. Markup lives in <ResourceVersionLanding>.
 *
 * @param {{
 *   load: (id: string) => Promise<object>,
 *   provideKey: string,
 *   versionService: object,
 *   resourceType: string,
 *   routeName: string,           // listing route name (carries optional `tab`)
 *   versionRouteName: string     // route name for a specific version
 * }} config
 */
export function useResourceVersionLanding({
  load,
  provideKey,
  versionService,
  resourceType,
  routeName,
  versionRouteName
}) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const resourceId = computed(() => String(route.params.id))

  const resource = ref(null)
  const isLoading = ref(true)
  const loadError = ref(null)

  provide(provideKey, resource)

  const loadResource = async () => {
    if (!resource.value) isLoading.value = true
    loadError.value = null
    try {
      resource.value = await load(resourceId.value)
    } catch (err) {
      loadError.value = err
      resource.value = null
    } finally {
      isLoading.value = false
    }
  }

  watch(resourceId, loadResource, { immediate: true })

  const versionsQuery = versionService.useListVersionsQuery(resourceId.value)
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
    get: () =>
      String(route.params.tab) === 'settings' ? LANDING_TAB.SETTINGS : LANDING_TAB.VERSIONS,
    set: (index) => {
      const params = { id: resourceId.value }
      if (index === LANDING_TAB.SETTINGS) params.tab = 'settings'
      router.replace({ name: routeName, params })
    }
  })

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  // On the Settings tab the drawer pre-selects the latest version; on Versions it
  // opens unfilled. Options come from the shared mapper (no current on a listing).
  const deployVersionId = computed(() =>
    activeTab.value === LANDING_TAB.SETTINGS ? latestVersionId.value : null
  )
  const deployResourceContext = computed(() => ({
    resourceType,
    resourceId: Number(resourceId.value),
    resourceName: resource.value?.name ?? '',
    version: deployVersionId.value ? { id: deployVersionId.value } : null,
    versions: toDeployableVersionOptions(rawVersions.value)
  }))

  const goToVersionsList = () => {
    activeTab.value = LANDING_TAB.VERSIONS
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
      case VERSION_ACTIONS.SAVE_AND_BUILD:
        goToVersionsList()
        return
      case VERSION_ACTIONS.NEW_DRAFT_FROM:
        if (result?.id) {
          router.push({
            name: versionRouteName,
            params: { id: resourceId.value, versionId: result.id }
          })
        }
        return
      case VERSION_ACTIONS.SAVE:
        loadResource()
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
    toast.add({ closable: true, severity: 'error', summary: 'Error', detail })
  }

  return {
    resource,
    resourceId,
    isLoading,
    loadError,
    latestVersionId,
    activeTab,
    isDeployDrawerOpen,
    openDeployDrawer,
    deployResourceContext,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  }
}
