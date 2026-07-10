import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const transformVersionsList = (data) => {
  if (!Array.isArray(data)) return []

  return data.map((item) => ({
    id: item.version_id,
    label: item.version_id,
    versionState: item.version_state,
    isCurrent: item.version_state === 'ready',
    lastEditor: item.last_editor,
    lastModified: formatDateToDayMonthYearHour(item.created_at)
  }))
}
