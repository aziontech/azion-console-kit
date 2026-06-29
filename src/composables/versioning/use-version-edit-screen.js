import { computed, provide, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@aziontech/webkit/use-toast'
import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'

const SUCCESS_SUMMARY = {
  [VERSION_ACTIONS.SAVE]: 'Version saved',
  [VERSION_ACTIONS.SAVE_AND_BUILD]: 'Build started',
  [VERSION_ACTIONS.CANCEL_BUILD]: 'Build cancelled',
  [VERSION_ACTIONS.NEW_DRAFT_FROM]: 'Draft created',
  [VERSION_ACTIONS.ARCHIVE]: 'Version archived',
  [VERSION_ACTIONS.DELETE]: 'Version deleted'
}

/**
 * useVersionEditScreen — the single source of truth for the FULL version editor
 * screen shared by every resource (CustomPage / Application / Firewall / Workload).
 *
 * Owns: route params, the missing-versionId redirect, resource load + watch, the
 * page title, the editor ref (so the footer DEPLOY routes to the release composer
 * via the heading's entry), toast + navigation, and the command-success/error
 * handlers. Each view specializes via config; markup lives in <VersionEditScreen>.
 *
 * @param {{
 *   load: (id: string) => Promise<object>,
 *   provideKey?: string | null,        // provide(resource) for nested fields; null = none (Workload)
 *   listRoute: (id: string) => object, // router location for the versions listing
 *   versionRouteName: string,          // route name for a specific version
 *   titleWithVersion?: boolean,        // `${name} — Version ${id}` vs bare name (Workload)
 *   supportsDeployDrawer?: boolean     // DEPLOY opens the drawer; false falls through (Workload)
 * }} config
 */
export function useVersionEditScreen({
  load,
  provideKey = null,
  listRoute,
  versionRouteName,
  titleWithVersion = true,
  supportsDeployDrawer = true
}) {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const resourceId = computed(() => String(route.params.id))
  const versionId = computed(() => (route.params.versionId ? String(route.params.versionId) : null))

  if (!versionId.value) {
    router.replace(listRoute(resourceId.value))
  }

  const resource = ref(null)
  const isLoading = ref(true)
  const loadError = ref(null)

  if (provideKey) provide(provideKey, resource)

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

  const title = computed(() => {
    const name = resource.value?.name ?? ''
    if (!titleWithVersion || !name || !versionId.value) return name
    return `${name} — Version ${versionId.value}`
  })

  const editorRef = ref(null)

  const goToVersionsList = () => router.push(listRoute(resourceId.value))
  const handleCancel = () => goToVersionsList()

  const handleCommandSuccess = ({ action, result }) => {
    // DEPLOY routes to the full-page composer, the SAME entry the heading Deploy
    // owns. Resources without a deploy affordance (Workload) fall through to the
    // generic toast.
    if (action === VERSION_ACTIONS.DEPLOY && supportsDeployDrawer) {
      editorRef.value?.openRelease()
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
    versionId,
    isLoading,
    loadError,
    title,
    editorRef,
    handleCommandSuccess,
    handleCommandError,
    handleCancel
  }
}
