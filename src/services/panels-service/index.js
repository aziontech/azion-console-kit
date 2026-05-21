import { PREDEFINED_PANELS } from '@/views/RealTimeEvents/Blocks/constants/predefined-panels'
import REPORTS from '@/modules/real-time-metrics/constants/reports'
import {
  getItem,
  setItem,
  hasStorageAccessError,
  reportPanelsStorageIssue,
  safeDecodeBase64Json,
  safeEncodeBase64Json
} from './storage-utils'

const STORAGE_KEY = 'rte-custom-panels'

/**
 * Validates a PanelConfig object.
 * @param {unknown} config - The config to validate.
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validatePanelConfig = (config) => {
  const errors = []

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be a non-null object'] }
  }

  if (typeof config.id !== 'string' || config.id.trim() === '') {
    errors.push('id must be a non-empty string')
  }

  if (typeof config.label !== 'string' || config.label.trim() === '') {
    errors.push('label must be a non-empty string')
  } else if (config.label.length > 50) {
    errors.push('label must be at most 50 characters')
  }

  if (config.type !== 'predefined' && config.type !== 'custom') {
    errors.push("type must be 'predefined' or 'custom'")
  }

  const hasCharts = Array.isArray(config.charts) && config.charts.length > 0
  const hasEventsConfig = config.eventsConfig != null

  if (!hasCharts && !hasEventsConfig) {
    errors.push('Must have at least one chart or a non-null eventsConfig')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Filters ChartReference array, keeping only those whose reportId exists in REPORTS.
 * Preserves order.
 * @param {Array<{ reportId: string, columns?: number }>} chartRefs
 * @returns {Array<{ reportId: string, columns?: number }>}
 */
export const filterValidCharts = (chartRefs) => {
  if (!Array.isArray(chartRefs)) {
    return []
  }

  const validIds = new Set(REPORTS.map((report) => report.id))
  return chartRefs.filter((ref) => ref && validIds.has(ref.reportId))
}

/**
 * Loads all panels: predefined + custom from localStorage.
 * Invalid custom configs are discarded individually.
 * @returns {Array<object>}
 */
export const loadPanels = () => {
  const { panels } = loadPanelsWithMeta()
  return panels
}

/**
 * Loads all panels with metadata about the loading process.
 * Returns panels, count of discarded invalid configs, and localStorage availability.
 * @returns {{ panels: Array<object>, discardedCount: number, localStorageAvailable: boolean }}
 */
export const loadPanelsWithMeta = () => {
  let customPanels = []
  let discardedCount = 0
  let localStorageAvailable = true

  try {
    const raw = getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        const totalCount = parsed.length
        customPanels = parsed.filter((panel) => {
          const { valid, errors } = validatePanelConfig(panel)
          if (!valid) {
            reportPanelsStorageIssue('Discarding invalid custom panel', errors)
          }
          return valid
        })
        discardedCount = totalCount - customPanels.length
      }
    }
  } catch (err) {
    if (hasStorageAccessError(err)) {
      localStorageAvailable = false
      reportPanelsStorageIssue('localStorage is unavailable, returning predefined panels only')
    } else {
      reportPanelsStorageIssue(
        'Failed to load custom panels from localStorage, returning predefined only'
      )
    }
  }

  return {
    panels: [...PREDEFINED_PANELS, ...customPanels],
    discardedCount,
    localStorageAvailable
  }
}

/**
 * Saves a new custom panel to localStorage.
 * Validates before saving.
 * @param {object} config - PanelConfig to save.
 */
export const savePanel = (config) => {
  const { valid, errors } = validatePanelConfig(config)
  if (!valid) {
    throw new Error(`Invalid panel config: ${errors.join(', ')}`)
  }

  let existing = []
  try {
    const raw = getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        existing = parsed
      }
    }
  } catch {
    existing = []
  }

  existing.push(config)
  setItem(STORAGE_KEY, JSON.stringify(existing))
}

/**
 * Updates an existing custom panel in localStorage by id.
 * Merges partial config, validates, then saves.
 * @param {string} id - Panel id to update.
 * @param {object} config - Partial PanelConfig to merge.
 */
export const updatePanel = (id, config) => {
  let existing = []
  try {
    const raw = getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        existing = parsed
      }
    }
  } catch {
    throw new Error('Failed to read panels from localStorage')
  }

  const index = existing.findIndex((panel) => panel.id === id)
  if (index === -1) {
    throw new Error(`Panel with id "${id}" not found`)
  }

  const merged = { ...existing[index], ...config }
  const { valid, errors } = validatePanelConfig(merged)
  if (!valid) {
    throw new Error(`Invalid panel config after merge: ${errors.join(', ')}`)
  }

  existing[index] = merged
  setItem(STORAGE_KEY, JSON.stringify(existing))
}

/**
 * Deletes a custom panel from localStorage by id.
 * @param {string} id - Panel id to delete.
 */
export const deletePanel = (id) => {
  let existing = []
  try {
    const raw = getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        existing = parsed
      }
    }
  } catch {
    throw new Error('Failed to read panels from localStorage')
  }

  const filtered = existing.filter((panel) => panel.id !== id)
  setItem(STORAGE_KEY, JSON.stringify(filtered))
}

/**
 * Encodes a PanelConfig for sharing via URL (Base64 JSON).
 * @param {object} config - PanelConfig to encode.
 * @returns {string}
 */
export const encodePanelForSharing = (config) => {
  return safeEncodeBase64Json(config)
}

/**
 * Decodes a PanelConfig from a Base64-encoded sharing string.
 * Returns the PanelConfig if valid, or null if decoding/validation fails.
 * @param {string} encoded - Base64-encoded string.
 * @returns {object|null}
 */
export const decodePanelFromSharing = (encoded) => {
  const config = safeDecodeBase64Json(encoded)
  if (!config) {
    return null
  }
  const { valid } = validatePanelConfig(config)
  if (!valid) {
    return null
  }
  return config
}

/**
 * Encodes the full view state (tab + filters + dataset) for sharing via URL.
 * The state is opaque to the service; callers pass an object of their choosing.
 * @param {object} state
 * @returns {string} Base64-encoded JSON.
 */
const SHARE_STATE_VERSION = 1

export const encodeShareState = (state) => {
  const payload = { ver: SHARE_STATE_VERSION, ...state }
  return safeEncodeBase64Json(payload)
}

/**
 * Decodes a share state string back into an object.
 * Returns null on parse/decode failure.
 * @param {string} encoded
 * @returns {object|null}
 */
export const decodeShareState = (encoded) => {
  const state = safeDecodeBase64Json(encoded)
  if (!state || typeof state !== 'object' || state.ver !== SHARE_STATE_VERSION) {
    return null
  }
  return state
}
