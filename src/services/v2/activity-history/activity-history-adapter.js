import { formatExhibitionDate } from '@/helpers/convert-date'

export const ActivityHistoryAdapter = {
  transformListActivityHistoryEvents({ data }) {
    try {
      const parsedEvents =
        data?.activityHistoryEvents?.map((element) => ({
          ts: formatExhibitionDate(element.ts, 'full', 'short'),
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
