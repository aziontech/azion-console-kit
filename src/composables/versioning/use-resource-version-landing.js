import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@aziontech/webkit/use-toast'
import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'
import { toDeployableVersionOptions } from '@/composables/versioning/to-version-options'
import { getVersionCapability } from '@/composables/versioning/version-capability'
import { useActiveVersions } from '@/composables/versioning/use-active-versions'
import { VERSION_SELECTION_PAGE_SIZE } from '@/composables/versioning/use-deploy-resource-context'
import { releaseComposerRouteFromResource } from '@/templates/release-composition/release-composer-route'

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
 * @param {{
 * load: (id: string) => Promise<object>,
 * provideKey: string,
 * versionService: object,
 * resourceType: string,
 * routeName: string,           // listing route name (carries optional `tab`)
 * versionRouteName: string     // route name for a specific version
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

  const capability = getVersionCapability(resourceType)

  const resourceId = computed(() => String(route.params.id))

  const resource = ref(null)
  const isLoading = ref(true)
  const loadError = ref(null)

  provide(provideKey, resource)

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

  const versionsQuery = versionService.useListVersionsQuery(resourceId.value, {
    pageSize: VERSION_SELECTION_PAGE_SIZE
  })
  const rawVersions = computed(() => versionsQuery.data.value?.body ?? [])

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
      return showOverview ? tabs.indexOf('overview') : tabs.indexOf('versions')
    },
    set: (index) => {
      const key = tabs.keyAt(index)
      const params = { id: resourceId.value }
      const defaultKey = showOverview ? 'overview' : 'versions'
      if (key && key !== defaultKey) params.tab = key
      router.replace({ name: routeName, params })
    }
  })

  const deployableVersionOptions = computed(() => toDeployableVersionOptions(rawVersions.value))

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
    openRelease,
    openPromoteRelease,
    handleCommandSuccess,
    handleCommandError,
    handleCancel,
    versionsQuery,
    rawVersions,
    activeVersions,
    activeVersionsLoading,
    refreshActiveVersions
  }
}
