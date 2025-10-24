import {
  adaptServiceDataResponse,
  adaptServiceDataResponseToLoad
} from '@/services/v2/utils/adaptServiceDataResponse'

const transformMap = {
  id: (value) => value.id,
  description: (value) => value.description,
  name: (value) => value.name,
  ttl: (value) => value.ttl,
  type: (value) => value.type,
  rdata: (value) => value.rdata,
  policy: (value) => value.policy,
  weight: (value) => value.weight
}

export const EdgeDNSRecordsAdapter = {
  transformListRecords(data, fields) {
    const adapt = adaptServiceDataResponse(data, fields, transformMap)
    const dataWithValue = adapt.map((item) => ({ ...item, value: item.rdata }))
    return dataWithValue
  },

  transformLoadRecord({ data }, fields) {
    const adapt = adaptServiceDataResponseToLoad(data, fields, transformMap)
    const dataWithValue = {
      ...adapt,
      selectedPolicy: adapt.policy,
      selectedRecordType: adapt.type,
      value: adapt.rdata.join('\n')
    }
    return dataWithValue
  },

  transformPayload(payload) {
    return {
      description: payload.description,
      name: payload.name,
      ttl: payload.ttl,
      type: payload.selectedRecordType,
      rdata: payload.value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
      policy: payload.selectedPolicy,
      weight: payload.weight
    }
  }
}
