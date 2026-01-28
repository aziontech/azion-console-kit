import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const ActivityHistoryAdapter = {
  transformListActivityHistoryEvents({ data }) {
    try {
      const parsedEvents =
        data?.activityHistoryEvents?.map((element) => ({
          ts: formatDateToDayMonthYearHour(element.ts),
          title: element.title,
          type: element.type,
          authorName: element.authorName,
          authorEmail: element.authorEmail
        })) || []

      return parsedEvents
    } catch (error) {
      return []
    }
  }
}
