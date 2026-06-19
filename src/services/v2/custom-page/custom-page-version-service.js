import { VersionServiceBase } from '@/services/v2/versioning/version-service-base'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { CustomPageVersionAdapter } from './custom-page-version-adapter'

/**
 * Custom Page version service. All lifecycle endpoints + cache invalidation are
 * inherited from `VersionServiceBase`; only the resource bindings differ.
 */
export class CustomPageVersionService extends VersionServiceBase {
  constructor() {
    super()
    this.adapter = CustomPageVersionAdapter
    this.baseURL = 'v4/workspace/custom_pages'
    this.versionKeys = queryKeys.customPages.version
  }
}

export const customPageVersionService = new CustomPageVersionService()
