import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

const tryParseRequestDataObject = (value) => {
  if (!value) return null
  if (typeof value === 'object') return value

  const asString = String(value)
  const trimmed = asString.trim()
  if (!trimmed) return null

  const tryParse = (input) => {
    try {
      return JSON.parse(input)
    } catch {
      return null
    }
  }

  return (
    tryParse(trimmed) ||
    tryParse(trimmed.replaceAll('\\"', '"').replaceAll('\\n', '\n').replaceAll('\\t', '\t'))
  )
}

const extractPurgeItems = (event) => {
  const resourceType = event?.resourceType
  if (!resourceType || !String(resourceType).startsWith('Purge:')) return null

  const parsed = tryParseRequestDataObject(event?.requestData)
  const items = parsed?.items

  if (!Array.isArray(items)) return null
  const normalized = items
    .map((item) => (item === null || item === undefined ? '' : String(item).trim()))
    .filter(Boolean)

  if (!normalized.length) return null
  return normalized.join(', ')
}

const formatRequestData = (value) => {
  if (!value) return '-'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  const asString = String(value)
  const trimmed = asString.trim()
  if (!trimmed) return '-'

  const tryParse = (input) => {
    try {
      return JSON.parse(input)
    } catch {
      return null
    }
  }

  const parsed =
    tryParse(trimmed) ||
    tryParse(trimmed.replaceAll('\\"', '"').replaceAll('\\n', '\n').replaceAll('\\t', '\t'))

  if (parsed && typeof parsed === 'object') {
    try {
      return JSON.stringify(parsed, null, 2)
    } catch {
      return asString
    }
  }

  return asString
}

export const ActivityHistoryAdapter = {
  transformListActivityHistoryEvents({ data }) {
    try {
      const parsedEvents =
        data?.activityHistoryEvents?.map((element, index) => ({
          id: `${element.ts}-${index}`,
          date: formatDateToDayMonthYearHour(element.ts),
          ts: formatDateToDayMonthYearHour(element.ts),
          title: element.title,
          operation: element.type,
          type: element.type,
          resourceType: element.resourceType || '-',
          resourceId: element.resourceId,
          resourceItemId: element.resourceItemId,
          resource: element.resourceType || '-',
          resourceName: extractPurgeItems(element) || element.resourceName || '-',
          resourceItemName: element.resourceItemId || '-',
          authorEmail: element.authorEmail,
          authorIp: element.remoteAddress || '-',
          accountId: element.accountId || '-',
          authorName: element.authorName,
          userAgent: element.userAgent || '-',
          requestData: formatRequestData(element.requestData),
          remotePort: element.remotePort || '-',
          comment: element.comment || '-'
        })) || []

      return parsedEvents
    } catch (error) {
      return []
    }
  }
}
