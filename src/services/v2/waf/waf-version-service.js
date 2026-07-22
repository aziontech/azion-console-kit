import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { WafVersionAdapter } from './waf-version-adapter'

export class WafVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = WafVersionAdapter
    this.baseURL = 'v4/workspace/wafs'
    this.versionKeys = queryKeys.waf.version
  }
}

export const wafVersionService = new WafVersionService()
