import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.uuid,
  name: (value) => value.name,
  description: (value) => value.description || '',
  lastModified: (value) => formatDateToDayMonthYearHour(value.created),
  lastModify: (value) => convertToRelativeTime(value.created),
  createdDate: (value) => value.created?.split('T')[0],
  expiresAt: (value) => formatDateToDayMonthYearHour(value.expires_at),
  expiresAtDate: (value) => value.expires_at?.split('T')[0],
  scope: () => 'Global'
}

export const PersonalTokenAdapter = {
  transformListPersonalTokens(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  }
}
