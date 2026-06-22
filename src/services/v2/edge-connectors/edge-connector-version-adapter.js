/**
 * Edge Connector version adapter — only the Connector-specific exceptions; the
 * common normalization/payload logic comes from `createVersionAdapter`.
 * Connector is polymorphic (HTTP/Storage/LiveIngest); HTTP nested sub-resources
 * (addresses, load_balancer, origin_shield, hmac) travel within the version
 * snapshot, so a single GET .../versions/{vid} carries the full config.
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { EdgeConnectorsAdapter } from './edge-connectors-adapter'

// Extracts the full Connector snapshot (all 3 types + nested HTTP blocks) into
// the UI form shape, reusing the existing load transform.
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object' || raw.type == null) return {}

  return EdgeConnectorsAdapter.transformLoadEdgeConnectors({ data: raw })
}

// Maps the UI form back to the root payload. Returns `{}` for a bare clone so the
// API keeps the cloned values.
const mapResourceFields = (source = {}) => {
  if (!source || source.type == null) return {}

  return EdgeConnectorsAdapter.transformPayloadEdgeConnectors(source)
}

export const EdgeConnectorVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
