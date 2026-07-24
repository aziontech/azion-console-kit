import { queryClient } from '@/services/v2/base/query/queryClient'
import { listWorkloadsDynamicFieldsService } from '@/services/workloads-services/list-workloads-dynamic-fields-service.js'
import { listTimezonesService } from '@/services/users-services'

// Advanced-filter reference data (workload fields for AQL autocomplete, the
// timezone list for the date-range picker) changes rarely, so cache it for a
// few minutes to dedupe the repeat fetches that happen as filters open/close.
const STALE_TIME_MS = 5 * 60 * 1000

const workloadDynamicFieldsKey = (params) => ['advanced-filter', 'workload-dynamic-fields', params]

const timezonesKey = () => ['advanced-filter', 'timezones']

/**
 * Vue Query-backed wrappers for the advanced-filter server calls. Components
 * consume these instead of importing the services directly, keeping HTTP out of
 * the component layer (no-direct-http-in-components) and giving the fetches
 * caching/deduplication (require-vue-query).
 */
export function useAdvancedFilterServices() {
  const listWorkloadsDynamicFields = (params = {}) =>
    queryClient.fetchQuery({
      queryKey: workloadDynamicFieldsKey(params),
      queryFn: () => listWorkloadsDynamicFieldsService(params),
      staleTime: STALE_TIME_MS
    })

  const listTimezones = () =>
    queryClient.fetchQuery({
      queryKey: timezonesKey(),
      queryFn: () => listTimezonesService(),
      staleTime: STALE_TIME_MS
    })

  return { listWorkloadsDynamicFields, listTimezones }
}
