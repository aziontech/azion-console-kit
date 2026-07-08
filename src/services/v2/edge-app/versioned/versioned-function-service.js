import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
import { EdgeApplicationFunctionsAdapter } from '@/services/v2/edge-app/edge-application-functions-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { enrichFunctionInstanceNames } from '@/services/v2/utils/enrichFunctionInstanceNames'

// Fields forced on the versioned list request so the linked Function id
// (`function`) is present for name enrichment — mirrors the non-versioned
// EdgeApplicationFunctionService.
const LIST_FIELDS = ['id', 'name', 'last_editor', 'last_modified', 'function']

const service = createVersionedSubResourceService({
  path: 'functions',
  adapter: {
    transformList: (results) => EdgeApplicationFunctionsAdapter.transformListFunctions(results),
    transformLoad: (data) =>
      EdgeApplicationFunctionsAdapter.transformLoadEdgeApplicationFunction(data),
    requestPayload: (payload) => EdgeApplicationFunctionsAdapter.transformPayload(payload),
    editPayload: (payload) => EdgeApplicationFunctionsAdapter.transformEditPayload(payload)
  },
  queryKeyGroup: queryKeys.application.version.functions,
  createdMessage: 'Your Function has been created',
  updatedMessage: 'Your Function has been updated'
})

// The shared ListView renders the linked Function name in a `functionInstanced`
// column. The generic factory list doesn't resolve it, so enrich here (keeping
// every row) the same way the non-versioned service does.
const baseList = service.list.bind(service)
service.list = async (appId, versionId, params = {}) => {
  const result = await baseList(appId, versionId, { ...params, fields: LIST_FIELDS })
  const body = await enrichFunctionInstanceNames({
    http: service.http,
    items: result.body,
    getReferenceId: (item) => item.edgeFunction ?? item.function
  })
  return { ...result, body }
}

export const versionedFunctionService = service
