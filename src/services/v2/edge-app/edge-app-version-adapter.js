import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { EdgeAppAdapter } from './edge-app-adapter'

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  const ui = {}
  const modules = raw.modules ?? {}

  if (raw.name != null) ui.name = raw.name
  if (modules.cache?.enabled != null) ui.edgeCacheEnabled = modules.cache.enabled
  if (modules.functions?.enabled != null) ui.edgeFunctionsEnabled = modules.functions.enabled
  if (modules.application_accelerator?.enabled != null) {
    ui.applicationAcceleratorEnabled = modules.application_accelerator.enabled
  }
  if (modules.image_processor?.enabled != null) {
    ui.imageProcessorEnabled = modules.image_processor.enabled
  }
  if (modules.tiered_cache?.enabled != null) {
    ui.tieredCacheEnabled = modules.tiered_cache.enabled
  }
  if (raw.active != null) ui.isActive = raw.active
  if (raw.debug != null) ui.debug = raw.debug

  return ui
}

export const EdgeAppVersionAdapter = createVersionAdapter({
  normalizeConfig,
  mapResourceFields: (values) => EdgeAppAdapter.transformPayload(values)
})
