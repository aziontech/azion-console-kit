import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

const parseStatusData = (status) => {
  return status
    ? { content: 'Active', severity: 'success' }
    : { content: 'Inactive', severity: 'danger' }
}

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  permissions: (value) =>
    value.permissions?.length ? value.permissions.map((item) => item.name) : [],
  status: (value) => parseStatusData(value.is_active)
}

const loadTransformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  permissions: (value) => value.permissions,
  isActive: (value) => value.is_active
}

export const TeamPermissionAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return adaptServiceDataResponse(data, null, transformMap)
  },

  transformItem(data) {
    if (!data) return null
    return {
      id: loadTransformMap.id(data),
      name: loadTransformMap.name(data),
      permissions: loadTransformMap.permissions(data),
      isActive: loadTransformMap.isActive(data)
    }
  },

  transformPayload(payload) {
    return {
      name: payload.name,
      permissions_ids: payload.permissions.map((item) => item.id),
      is_active: payload.isActive
    }
  }
}
