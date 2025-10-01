import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'
import { formatDateToDayMonthYearHour, convertToRelativeTime } from '@/helpers/convert-date'
import { formatBytes } from '@/helpers/format-bytes'

const transformMap = {
  id: (value) => value.name,
  name: (value) => value.name || value.key,
  active: (value) => parseStatusData(value.active),
  edgeAccess: (value) => value.edge_access,
  lastEditor: (value) => value.last_editor || '-',
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified) || '-',
  lastModify: (value) => (value.last_modified ? convertToRelativeTime(value.last_modified) : '-'),
  productVersion: (value) => value.product_version,
  size: (value) => value.size || '-'
}

export const EdgeStorageAdapter = {
  transformListEdgeStorageBuckets(data, fields) {
    const { results, count } = data
    const adapt = adaptServiceDataResponse(results, fields, transformMap)

    return {
      count,
      body: adapt
    }
  },

  transformListEdgeStorageFiles(data) {
    return data.results.map((file) => ({
      id: file.key,
      name: file.key,
      lastModified: formatDateToDayMonthYearHour(file.last_modified) || '-',
      lastModify: file.last_modified ? convertToRelativeTime(file.last_modified) : '-',
      size: file.is_folder ? '-' : formatBytes(file.size),
      isFolder: file.is_folder
    }))
  }
}
