import { useMutation } from '@tanstack/vue-query'
import { createDomainService as createLegacyDomainService } from '@/services/domains-services'
import {
  listEdgeApplicationsService as listLegacyEdgeApplicationsService,
  loadEdgeApplicationsService as loadLegacyEdgeApplicationsService
} from '@/services/edge-application-services/v4'
import { queryClient } from '@/services/v2/base/query/queryClient'

const STALE_TIME_MS = 0

const listEdgeApplicationsKey = (params) => [
  'workload-domain-drawer',
  'edge-applications',
  'list',
  params
]

const loadEdgeApplicationKey = ({ id }) => [
  'workload-domain-drawer',
  'edge-applications',
  'detail',
  id
]

export function useWorkloadDomainDrawerServices() {
  const createDomainMutation = useMutation({
    mutationFn: createLegacyDomainService
  })

  const createDomainService = (payload) => createDomainMutation.mutateAsync(payload)

  const listEdgeApplicationsService = (params = {}) =>
    queryClient.fetchQuery({
      queryKey: listEdgeApplicationsKey(params),
      queryFn: () => listLegacyEdgeApplicationsService(params),
      staleTime: STALE_TIME_MS
    })

  const loadEdgeApplicationsService = (payload) =>
    queryClient.fetchQuery({
      queryKey: loadEdgeApplicationKey(payload),
      queryFn: () => loadLegacyEdgeApplicationsService(payload),
      staleTime: STALE_TIME_MS
    })

  return {
    createDomainService,
    listEdgeApplicationsService,
    loadEdgeApplicationsService
  }
}
