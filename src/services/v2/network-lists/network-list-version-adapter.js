import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { NetworkListsAdapter } from './network-lists-adapter'

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object' || raw.type == null) return {}

  return NetworkListsAdapter.transformLoadNetworkList({ data: raw })
}

const mapResourceFields = (source = {}) => {
  if (!source || source.networkListType == null) return {}

  return NetworkListsAdapter.transformEditNetworkList(source)
}

export const NetworkListVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields
})
