import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

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
          resource: element.resourceType || '-',
          resourceName: element.resourceId || '-',
          resourceItemName: element.resourceItemId || '-',
          authorName: element.authorName,
          authorEmail: element.authorEmail,
          authorIp: element.remoteAddress || '-'
        })) || []

      return parsedEvents
    } catch (error) {
      return []
    }
  }
}
