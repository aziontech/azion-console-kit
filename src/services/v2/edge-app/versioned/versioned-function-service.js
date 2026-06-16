// Versioned Function service (scoped to appId + versionId).
import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
import { EdgeApplicationFunctionsAdapter } from '@/services/v2/edge-app/edge-application-functions-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const versionedFunctionService = createVersionedSubResourceService({
  path: 'functions',
  adapter: {
    transformList: (results) => EdgeApplicationFunctionsAdapter.transformListFunctions(results),
    transformLoad: (data) =>
      EdgeApplicationFunctionsAdapter.transformLoadEdgeApplicationFunction(data),
    // create forces `active: true`; edit must preserve the existing active state.
    requestPayload: (payload) => EdgeApplicationFunctionsAdapter.transformPayload(payload),
    editPayload: (payload) => EdgeApplicationFunctionsAdapter.transformEditPayload(payload)
  },
  queryKeyGroup: queryKeys.application.version.functions
})
