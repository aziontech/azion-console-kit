/**
 * Network List version adapter — only the list-specific exceptions; the common
 * normalization/payload logic comes from `createVersionAdapter`.
 * The list config (name, type, IP/ASN/Country items) travels within the version
 * snapshot, so a single GET .../versions/{vid} carries the full config.
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { NetworkListsAdapter } from './network-lists-adapter'

// Extracts the list snapshot (name, type, items) into the UI form shape,
// reusing the existing load transform.
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object' || raw.type == null) return {}

  return NetworkListsAdapter.transformLoadNetworkList({ data: raw })
}

// Maps the UI form back to the root payload. Returns `{}` for a bare clone so the
// API keeps the cloned values.
const mapResourceFields = (source = {}) => {
  if (!source || source.networkListType == null) return {}

  return NetworkListsAdapter.transformEditNetworkList(source)
}

export const NetworkListVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
