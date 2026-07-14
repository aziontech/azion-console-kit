import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@aziontech/webkit/use-toast'
import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'
import { toDeployableVersionOptions } from '@/composables/versioning/to-version-options'
import { getVersionCapability } from '@/composables/versioning/version-capability'
import { useActiveVersions } from '@/composables/versioning/use-active-versions'
import { releaseComposerRouteFromResource } from '@/templates/release-composition/release-composer-route'

// Landing tab route keys — the numeric index is derived from `showOverview` so
// callers that opt out of Overview keep VERSIONS at index 0 without regressions.
export const LANDING_TAB_KEYS = ['overview', 'versions', 'settings', 'variables']

const tabIndexer = (showOverview) => {
  const keys = showOverview
    ? LANDING_TAB_KEYS
    : LANDING_TAB_KEYS.filter((key) => key !== 'overview')
  return {
    keys,
    indexOf: (key) => keys.indexOf(key),
    keyAt: (index) => keys[index] ?? keys[0]
  }
}

// Back-compat: existing callers that read LANDING_TAB.VERSIONS/SETTINGS/VARIABLES
// keep working — these are the indexes for the classic (no Overview) layout.
export const LANDING_TAB = { VERSIONS: 0, SETTINGS: 1, VARIABLES: 2 }

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
 * resolver, the route-driven active tab, the Deploy/Promote entries (which route
 * to the full-page release composer) plus the legacy drawer's resourceContext
 * (kept as a rollback fallback, via the shared version-option mapper), toast +
 * navigation, and the command-success/error handlers. Markup lives in
 * <ResourceVersionLanding>.
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
  versionRouteName,
  showOverview = false
}) {
  const tabs = tabIndexer(showOverview)
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  // versioned-only resources have no Deploy/Promote affordance — no drawer wiring.
  const capability = getVersionCapability(resourceType)

  const resourceId = computed(() => String(route.params.id))

  const resource = ref(null)
  const isLoading = ref(true)
  const loadError = ref(null)

  provide(provideKey, resource)

  // Shared seam consumed by the slotted Versions tab to wire the single
  // row-menu router (useVersionMenuActions); avoids per-resource menu logic.
  // Promote is only seamed for deployable resources (capability.canDeploy).
  provide('versionMenuHost', {
    resourceType,
    resourceId,
    versionService,
    router,
    ...(capability.canDeploy
      ? { openPromoteDrawer: (payload) => openPromoteRelease(payload) }
      : {}),
    onSuccess: () => {
      versionsQuery.refetch?.()
      refreshActiveVersions()
    }
  })

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

  // Overview needs the active-versions map to render Live Deployments; kept at
  // the landing level so both the Overview slot and the Versions slot can share
  // the same fetch (and a single refresh after a mutation).
  const activeVersionsResourceRef = computed(() => ({ resourceType, resourceId: resourceId.value }))
  const {
    activeVersions,
    isLoading: activeVersionsLoading,
    refresh: refreshActiveVersions
  } = useActiveVersions(activeVersionsResourceRef)

  const latestVersionId = computed(() => {
    const list = rawVersions.value
    if (!list.length) return null
    const sorted = [...list].sort((left, right) =>
      String(right.createdAt || '').localeCompare(String(left.createdAt || ''))
    )
    return sorted[0]?.id ?? null
  })

  const activeTab = computed({
    get: () => {
      const key = String(route.params.tab ?? '')
      if (tabs.keys.includes(key)) return tabs.indexOf(key)
      // Default: Overview when enabled, otherwise Versions.
      return showOverview ? tabs.indexOf('overview') : tabs.indexOf('versions')
    },
    set: (index) => {
      const key = tabs.keyAt(index)
      const params = { id: resourceId.value }
      // Keep URLs clean for the default tab (no `?tab=overview` in the URL when
      // Overview is the landing default).
      const defaultKey = showOverview ? 'overview' : 'versions'
      if (key && key !== defaultKey) params.tab = key
      router.replace({ name: routeName, params })
    }
  })

  // DeployDrawerBlock stays mounted (rollback fallback); the visible/pinned models
  // are retained but the Deploy/Promote entries now route to the full-page composer.
  const isDeployDrawerOpen = ref(false)
  // Version pinned by a row-menu Promote; cleared when the drawer closes.
  const pinnedDeployVersionId = ref(null)

  // Deployable (Ready) version options; the shared mapper orders them newest-first.
  const deployableVersionOptions = computed(() => toDeployableVersionOptions(rawVersions.value))

  // Heading/footer Deploy: route to the composer scoped to this resource, pinning
  // the newest Ready version so the composer opens with a concrete selection.
  const openRelease = () => {
    router.push(
      releaseComposerRouteFromResource({
        resourceType,
        resourceId: Number(resourceId.value),
        version: null,
        versions: deployableVersionOptions.value
      })
    )
  }

  // Promote from the row menu: route to the composer with this version pinned.
  const openPromoteRelease = ({ pin } = {}) => {
    router.push(
      releaseComposerRouteFromResource({
        resourceType,
        resourceId: Number(resourceId.value),
        version: pin ? { id: pin } : null,
        versions: deployableVersionOptions.value
      })
    )
  }

  // A row-menu Promote pins a version; otherwise default to the latest deployable
  // one so the drawer always references a concrete version (the banner and the
  // promote stay consistent) regardless of the landing tab it was opened from.
  const deployVersionId = computed(
    () => pinnedDeployVersionId.value ?? deployableVersionOptions.value[0]?.value ?? null
  )
  // versioned-only: no deploy context built — the drawer is never fed nor mounted.
  const deployResourceContext = computed(() => {
    if (!capability.canDeploy) return null
    return {
      resourceType,
      resourceId: Number(resourceId.value),
      resourceName: resource.value?.name ?? '',
      version: deployVersionId.value ? { id: deployVersionId.value } : null,
      versions: deployableVersionOptions.value
    }
  })

  // Drop the pinned version once the drawer is dismissed so the next open is clean.
  watch(isDeployDrawerOpen, (open) => {
    if (!open) pinnedDeployVersionId.value = null
  })

  const goToVersionsList = () => {
    activeTab.value = tabs.indexOf('versions')
  }
  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    if (action === VERSION_ACTIONS.DEPLOY) {
      openRelease()
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
    openRelease,
    openPromoteRelease,
    deployResourceContext,
    handleCommandSuccess,
    handleCommandError,
    handleCancel,
    // Overview support
    versionsQuery,
    rawVersions,
    activeVersions,
    activeVersionsLoading,
    refreshActiveVersions
  }
}
