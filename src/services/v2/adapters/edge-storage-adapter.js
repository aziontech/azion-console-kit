import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'

const transformMap = {
  name: (value) => value.name,
  active: (value) => parseStatusData(value.active),
  edgeAccess: (value) => value.edge_access,
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => value.last_modified,
  productVersion: (value) => value.product_version
}

export const EdgeStorageAdapter = {
  transformListEdgeStorageBuckets(data, fields) {
    const { results, count } = data
    const adapt = adaptServiceDataResponse(results, fields, transformMap)

    return {
      count,
      body: adapt
    }
  }
}
