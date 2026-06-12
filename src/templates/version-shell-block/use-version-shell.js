import { computed } from 'vue'
import {
  isEditable,
  getAvailableActions,
  isActionAvailable
} from '@/composables/versioning/version-machine'

/**
 * Internal VersionShell composable.
 *
 * - Reads the version by calling a factory passed via prop (`useVersionQuery`).
 *   The service behind it controls queryKey, refetchInterval and cache.
 * - Derives state/readOnly/availableActions/disabledActions.
 * - Dispatches commands through the shell's command bus. Does not touch cache.
 *
 * @param {Object} params
 * @param {Function}      params.useVersionQuery — factory returning UseQueryReturn
 * @param {string|number} params.resourceId
 * @param {string}        params.versionId
 * @param {Object}        params.bus
 */
export const useVersionShell = ({ useVersionQuery, resourceId, versionId, bus }) => {
  const versionQuery = useVersionQuery()

  const version = computed(() => versionQuery.data.value ?? null)
  const state = computed(() => version.value?.state ?? 'draft')
  const readOnly = computed(() => !isEditable(state.value))

  const availableActions = computed(() => {
    const stateActions = getAvailableActions(state.value)
    return stateActions.filter((cmd) => bus.registered.value.has(cmd))
  })

  const disabledActions = computed(() => {
    const disabled = []
    for (const [cmd, entry] of bus.registered.value) {
      if (entry.ready && !entry.ready.value) disabled.push(cmd)
    }
    return disabled
  })

  const dispatch = async (action, payload = {}) => {
    if (!isActionAvailable(state.value, action)) {
      // eslint-disable-next-line no-console
      console.warn(`[VersionShell] Action ${action} not available in state ${state.value}`)
      return
    }
    if (!bus.registered.value.has(action)) {
      // eslint-disable-next-line no-console
      console.warn(`[VersionShell] No handler registered for ${action}`)
      return
    }

    const ctx = { resourceId, versionId, comment: payload.comment }
    // The shell does not invalidate cache: each mutation in the resource service
    // already calls queryClient.removeQueries, and the internal useQuery refetches on its own.
    // The handler result is returned to the caller (e.g. draft created by
    // NEW_DRAFT_FROM, used for navigation).
    return await bus.emit(action, ctx)
  }

  return {
    version,
    state,
    readOnly,
    availableActions,
    disabledActions,
    dispatch,
    isLoading: versionQuery.isLoading,
    isError: versionQuery.isError
  }
}
