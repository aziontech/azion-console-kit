import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { EdgeConnectorsAdapter } from './edge-connectors-adapter'

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object' || raw.type == null) return {}

  return EdgeConnectorsAdapter.transformLoadEdgeConnectors({ data: raw })
}

const mapResourceFields = (source = {}) => {
  if (!source || source.type == null) return {}

  return EdgeConnectorsAdapter.transformPayloadEdgeConnectors(source)
}

export const EdgeConnectorVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
