import { computed, ref } from 'vue'
import {
  isEditable,
  getAvailableActions,
  isActionAvailable
} from '@/composables/versioning/version-machine'

/**
 * @param {Object} params
 * @param {Function} params.useVersionQuery
 * @param {string|number} params.resourceId
 * @param {string} params.versionId
 * @param {Object} params.bus
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

  const pendingAction = ref(null)
  const isDispatching = computed(() => pendingAction.value !== null)

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
    if (pendingAction.value) {
      // eslint-disable-next-line no-console
      console.warn(
        `[VersionShell] Action ${action} ignored — ${pendingAction.value} already in flight`
      )
      return
    }

    pendingAction.value = action
    try {
      const ctx = { resourceId, versionId, comment: payload.comment }
      return await bus.emit(action, ctx)
    } finally {
      pendingAction.value = null
    }
  }

  return {
    version,
    state,
    readOnly,
    availableActions,
    disabledActions,
    dispatch,
    isDispatching,
    isLoading: versionQuery.isLoading,
    isError: versionQuery.isError
  }
}
