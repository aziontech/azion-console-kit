import { listCacheSettingsService } from './list-cache-settings-service'
import { createCacheSettingsService } from './create-cache-settings-service'
import { loadCacheSettingsService } from './load-cache-settings-service'
import { editCacheSettingsService } from './edit-cache-settings-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listCacheSettingsService} listCacheSettingsService - The listCacheSettingsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export {
  listCacheSettingsService,
  createCacheSettingsService,
  loadCacheSettingsService,
  editCacheSettingsService
}
