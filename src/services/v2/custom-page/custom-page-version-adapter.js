/**
 * Custom Page version adapter — only the Custom-Page-specific exceptions; the
 * common normalization/payload logic comes from `createVersionAdapter`.
 */
import { createVersionAdapter } from '@/services/v2/versioning/version-adapter'
import { CustomPageAdapter, transformPageItem } from './custom-page-adapter'

// Extracts the Custom Page config from a version snapshot, preserving `pages[]`.
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  const ui = {}
  if (raw.name != null) ui.name = raw.name
  if (raw.active != null) ui.active = raw.active
  if (Array.isArray(raw.pages)) ui.pages = raw.pages.map(transformPageItem)

  return ui
}

// Maps UI fields (name/active/pages) into the resource payload. Returns `{}` for a
// bare clone so the API keeps the cloned values.
const mapResourceFields = (source = {}) => {
  const hasResourceFields =
    source.name !== undefined || source.active !== undefined || Array.isArray(source.pages)
  if (!hasResourceFields) return {}

  return CustomPageAdapter.transformPayloadCreateCustomPage({
    name: source.name,
    active: source.active,
    pages: Array.isArray(source.pages) ? source.pages : []
  })
}

export const CustomPageVersionAdapter = createVersionAdapter({ normalizeConfig, mapResourceFields })
