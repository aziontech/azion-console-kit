import {
  adaptServiceDataResponse,
  adaptServiceDataResponseToLoad
} from '@/services/v2/utils/adaptServiceDataResponse'
import { parseStatusData } from '@/services/v2/utils/adapter/parse-status-utils'

const transformMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  active: (value) => parseStatusData(value.active),
  domain: (value) => {
    return {
      content: value.domain
    }
  }
}

const transformLoadingMap = {
  id: (value) => value.id,
  name: (value) => value.name,
  active: (value) => parseStatusData(value.active),
  domain: (value) => value.domain,
  nameservers: (value) => value.nameservers,
  productVersion: (value) => value.product_version
}

const transformLoadingEdgeDNSSECMap = {
  enabled: (value) => value.enabled,
  status: (value) => value.status,
  delegationSigner: (value) => value.delegation_signer
}

export const EdgeDNSAdapter = {
  transformListEdgeDNS(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },

  transformLoadEdgeDNS(data, fields) {
    const adapt = adaptServiceDataResponseToLoad(data, fields, transformLoadingMap)
    const dataWithActive = { ...adapt, isActive: adapt.active.content === 'Active' }
    return dataWithActive
  },

  transformLoadEdgeDNSSEC(data, fields) {
    return adaptServiceDataResponseToLoad(data, fields, transformLoadingEdgeDNSSECMap)
  },

  transformPayload(payload) {
    return {
      name: payload.name,
      domain: payload.domain,
      active: payload.isActive
    }
  },

  transformPayloadEdit(payload) {
    return {
      name: payload.name,
      active: payload.isActive
    }
  }
}
