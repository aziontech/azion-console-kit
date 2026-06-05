import { useMutation } from '@tanstack/vue-query'
import { createEdgeApplicationService as createLegacyEdgeApplicationService } from '@/services/edge-application-services'

export function useEdgeApplicationV3CreateService() {
  const createMutation = useMutation({
    mutationFn: createLegacyEdgeApplicationService
  })

  const createEdgeApplicationService = (payload) => createMutation.mutateAsync(payload)

  return {
    createEdgeApplicationService
  }
}
