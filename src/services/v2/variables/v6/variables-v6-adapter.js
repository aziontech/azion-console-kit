import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'

const MASK = '••••••••'

const unwrap = (data) => data?.data ?? data

const buildValue = (item) => ({
  isSecret: item.secret,
  content: item.secret ? MASK : item.value
})

const mapItem = (item) => ({
  id: item.uuid,
  key: item.key,
  value: buildValue(item),
  scope: item.scope,
  lastEditor: item.last_editor,
  lastModified: formatDateToDayMonthYearHour(item.updated_at),
  lastModify: convertToRelativeTime(item.updated_at)
})

const transformScopePayload = (scope) => {
  if (!Array.isArray(scope)) return []
  return scope.map((item) => {
    if (item.type === 'global') return { type: 'global' }
    const type = item.type === 'resource' ? item.resourceType : item.type
    return { type, [`${type}_id`]: item.id }
  })
}

export const VariablesV6Adapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map(mapItem)
  },

  transformItem(data) {
    const item = unwrap(data)
    if (!item) return null
    return mapItem(item)
  },

  transformFormItem(data) {
    const item = unwrap(data)
    if (!item) return null
    return {
      id: item.uuid,
      key: item.key,
      value: item.secret ? '' : item.value,
      secret: item.secret,
      scope: item.scope
    }
  },

  transformVersionsList(data) {
    if (!Array.isArray(data)) return []

    const numbers = data.map((item) => Number(item.version))
    const maxVersion = numbers.length ? Math.max(...numbers) : null

    return data.map((item) => ({
      id: item.version_id,
      label: `Version ${item.version}`,
      versionNumber: item.version,
      isCurrent: item.current ?? Number(item.version) === maxVersion,
      lastEditor: item.last_editor,
      lastModified: formatDateToDayMonthYearHour(item.created_at)
    }))
  },

  transformCreatePayload(payload) {
    return {
      key: payload.key,
      value: payload.value,
      secret: payload.secret,
      scope: transformScopePayload(payload.scope)
    }
  },

  transformPatchPayload(values, initialValues) {
    const current = values ?? {}
    const initial = initialValues ?? {}
    const payload = {}

    if (current.key !== initial.key) payload.key = current.key
    if (current.secret !== initial.secret) payload.secret = current.secret

    if (current.value !== initial.value) {
      const emptySecretValue =
        current.secret === true &&
        (current.value === '' || current.value === null || current.value === undefined)
      if (!emptySecretValue) payload.value = current.value
    }

    return payload
  },

  transformRollbackPayload() {
    return {}
  }
}
