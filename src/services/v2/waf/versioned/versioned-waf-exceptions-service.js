import { createVersionedSubResourceService } from '@/services/v2/edge-app/versioned/create-versioned-sub-resource-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { VersionedWafExceptionsAdapter } from '@/services/v2/waf/versioned/versioned-waf-exceptions-adapter'

/**
 * Versioned WAF exceptions (allowed rules) sub-resource, scoped to (wafId, versionId).
 *
 * Endpoints under `v4/workspace/wafs/{id}/versions/{vid}/exceptions`.
 * Mirrors the Firewall versioned sub-resources; every mutation invalidates
 * `queryKeys.waf.version.exceptions` so the shared Allowed Rules ListView stays fresh.
 */
export const versionedWafExceptionsService = createVersionedSubResourceService({
  baseURL: 'v4/workspace/wafs',
  path: 'exceptions',
  adapter: VersionedWafExceptionsAdapter,
  queryKeyGroup: queryKeys.waf.version.exceptions,
  createdMessage: 'Your WAF allowed rule has been created',
  updatedMessage: 'Your WAF allowed rule has been updated'
})
