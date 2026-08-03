import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { NetworkListVersionAdapter } from './network-list-version-adapter'

export class NetworkListVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = NetworkListVersionAdapter
    this.baseURL = 'v4/workspace/network_lists'
    this.versionKeys = queryKeys.networkList.version
  }
}

export const networkListVersionService = new NetworkListVersionService()
