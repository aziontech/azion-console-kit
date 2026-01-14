import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'
import { formatDateToDayMonthYearHour, convertToRelativeTime } from '@/helpers/convert-date'
import { formatBytes } from '@/helpers/format-bytes'

const transformMap = {
  id: (value) => value.name,
  name: (value) => value.name || value.key,
  active: (value) => parseStatusData(value.active),
  workloadsAccess: (value) => value.workloads_access,
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.last_modified),
  lastModify: (value) => convertToRelativeTime(value.last_modified),
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
    const files = data.results.map((file) => ({
      id: file.key,
      name: file.key,
      lastModified: file.last_modified ? formatDateToDayMonthYearHour(file.last_modified) : '-',
      lastModify: file.last_modified ? convertToRelativeTime(file.last_modified) : '-',
      size: file.is_folder ? '-' : formatBytes(file.size),
      isFolder: file.is_folder
    }))
    return {
      files,
      continuation_token: data?.continuation_token || null
    }
  },

  transformListEdgeStorageCredentials(data) {
    const { results, count } = data

    const capabilitiesMap = {
      listFiles: 'List Files',
      readFiles: 'Read Files',
      writeFiles: 'Write Files',
      deleteFiles: 'Delete Files',
      listAllBucketNames: 'List All Bucket Names',
      listBuckets: 'List Buckets'
    }

    const adaptParsed = results.map((credential) => ({
      id: credential.id,
      name: credential.name,
      accessKey: credential.access_key,
      capabilities: credential.capabilities.map(
        (capability) => capabilitiesMap[capability] || capability
      ),
      createDate: formatDateToDayMonthYearHour(credential.last_modified),
      expirationDate: formatDateToDayMonthYearHour(credential.expiration_date),
      bucket: credential.buckets,
      lastEditor: credential.last_editor,
      lastModify: convertToRelativeTime(credential.last_modified)
    }))

    return {
      count,
      body: adaptParsed
    }
  },

  transformCreateEdgeStorageBucket(data) {
    return {
      name: data.name,
      capabilities: data.capabilities,
      expiration_date: data.expirationDate,
      buckets: data.bucket[0] === '__ALL_BUCKETS__' ? null : data.bucket
    }
  }
}
