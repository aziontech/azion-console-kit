import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
import { EdgeApplicationFunctionsAdapter } from '@/services/v2/edge-app/edge-application-functions-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { enrichFunctionInstanceNames } from '@/services/v2/utils/enrichFunctionInstanceNames'

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
