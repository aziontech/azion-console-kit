import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.variable_id ?? value.uuid,
  key: (value) => value.key,
  value: (value) => ({
    isSecret: value.secret,
    content: value.value
  }),
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.updated_at),
  lastModify: (value) => convertToRelativeTime(value.updated_at),
  scope: (value) => value.scope,
  source: (value) => value.source,
  versionId: (value) => value.version_id,
  state: (value) => value.state ?? value.source
}

export const VariablesAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return adaptServiceDataResponse(data, null, transformMap)
  },

  transformItem(data) {
    if (!data) return null
    return adaptServiceDataResponse([data], null, transformMap)[0]
  },

  transformPayload(payload) {
    return {
      key: payload.key,
      value: payload.value,
      secret: payload.secret
    }
  },

  transformPayloadV6(payload) {
    return {
      key: payload.key,
      value: payload.value,
      secret: payload.secret,
      scope: VariablesAdapter.transformScopePayload(payload.scope)
    }
  },

  transformScopePayload(scope) {
    if (!Array.isArray(scope)) return []
    return scope.map((item) => {
      if (item.type === 'global') return { type: 'global' }
      const idKey = `${item.type}_id`
      return { type: item.type, [idKey]: item[idKey] }
    })
  }
}
