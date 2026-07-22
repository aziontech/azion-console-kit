import { versionedWafExceptionsService } from '@/services/v2/waf/versioned/versioned-waf-exceptions-service'

/**
 * @param {string|number} resourceId
 * @param {string} versionId
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
