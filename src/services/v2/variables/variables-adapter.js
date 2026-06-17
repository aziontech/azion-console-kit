import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.variable_id ?? value.uuid,
  key: (value) => value.key,
  value: (value) => ({
    isSecret: value.secret,
    content: value.secret ? (value.value ?? '********') : value.value
  }),
  lastEditor: (value) => value.last_editor,
  lastModified: (value) => formatDateToDayMonthYearHour(value.updated_at),
  lastModify: (value) => convertToRelativeTime(value.updated_at),
  scope: (value) => value.scope,
  source: (value) => value.source,
  versionId: (value) => value.version_id,
  state: (value) => value.state ?? value.source
}

const transformItem = (data) => {
  if (!data) return null
  return adaptServiceDataResponse([data], null, transformMap)[0]
}

const transformFormItem = (data) => {
  const variable = transformItem(data)
  if (!variable) return null

  const isSecret = variable.value?.isSecret ?? false

  return {
    id: variable.id,
    key: variable.key,
    value: isSecret ? '' : (variable.value?.content ?? variable.value),
    secret: isSecret
  }
}

export const VariablesAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return adaptServiceDataResponse(data, null, transformMap)
  },

  transformItem,

  transformFormItem,

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
