import { isProcessing } from '@/composables/versioning/version-machine'
import { toMilliseconds } from '@/services/v2/base/query/config'

export const VERSION_POLL_INTERVAL_MS = toMilliseconds({ seconds: 3 })

export const LIVE_UPDATE_STRATEGY = 'polling' // 'polling' | 'events'

export const hasTransientVersions = (data) =>
  Array.isArray(data?.body) && data.body.some((version) => isProcessing(version?.state))

export const versionListCachePolicy = () => ({
  refetchInterval: (query) =>
    LIVE_UPDATE_STRATEGY === 'polling' && hasTransientVersions(query.state.data)
      ? VERSION_POLL_INTERVAL_MS
      : false,
  refetchOnMount: (query) => (hasTransientVersions(query.state.data) ? 'always' : false)
})
