import { versionedWafExceptionsService } from '@/services/v2/waf/versioned/versioned-waf-exceptions-service'

/**
 * Builds one facade per WAF versioned sub-resource, pre-bound to a
 * `(resourceId, versionId)` pair and delegating to the versioned services.
 *
 * Method signatures mirror how the existing Allowed Rules ListView already calls
 * `wafService.*`, so the shared component stays drop-in (no fork).
 *
 * @param {string|number} resourceId WAF id.
 * @param {string} versionId Version id the tabs are scoped to.
 * @returns {{ exceptions: object }}
 */
export const useVersionedFacades = (resourceId, versionId) => {
  const exceptions = {
    list: (query) => versionedWafExceptionsService.list(resourceId, versionId, query),
    load: (allowedId) => versionedWafExceptionsService.load(resourceId, versionId, allowedId),
    create: (payload) => versionedWafExceptionsService.create(resourceId, versionId, payload),
    edit: (payload) => versionedWafExceptionsService.edit(resourceId, versionId, payload),
    remove: (allowedId) => versionedWafExceptionsService.remove(resourceId, versionId, allowedId)
  }

  return { exceptions }
}
