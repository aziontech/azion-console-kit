import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.uuid,
  key: (value) => value.key,
  value: (value) => ({
    isSecret: value.secret,
    content: value.value
  }),
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.updated_at),
  lastModify: (value) => convertToRelativeTime(value.updated_at)
}

export const VariablesAdapter = {
  transformList(data, fields) {
    if (!Array.isArray(data)) return []
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformOne(data) {
    return {
      id: data?.uuid,
      key: data?.key,
      value: data?.value,
      secret: data?.secret
    }
  },

  transformPayload(payload) {
    return {
      key: payload.key,
      value: payload.value,
      secret: payload.secret
    }
  }
}
