/**
 * Adapter for Application Version.
 *
 * Normalizes API responses into UI-friendly shapes and converts UI form values
 * into the snake_case payloads expected by the
 * `/v4/workspace/applications/{rid}/versions` endpoints.
 *
 * Pure functions; no side effects.
 */

import { EdgeAppAdapter } from './edge-app-adapter'

/**
 * Recursively removes keys with `undefined` values from an object and discards
 * nested objects that became empty after stripping. Does not mutate the input.
 * @param {*} obj value to clean (plain objects are traversed; other types are returned as-is)
 * @returns {*} cleaned copy, or `undefined` when an object ends up with no keys
 */
const stripUndefinedDeep = (obj) => {
  if (obj === undefined) return undefined
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = stripUndefinedDeep(value)
    if (cleaned !== undefined) {
      result[key] = cleaned
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

/**
 * Extracts the Application config fields from a version snapshot into the UI
 * form shape, including ONLY the keys present in the raw object.
 *
 * API contract (confirmed 2026-06-12): version payloads carry the Application
 * fields at the ROOT (no `override` wrapper). So this reads from the version
 * object's root. Falls back to `{}` when the GET returns metadata only — in
 * which case the form initializes from the parent Application.
 * @param {object} [raw] raw version object coming from the API
 * @returns {object} subset of the UI form with the present keys
 */
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}

  const ui = {}
  const modules = raw.modules ?? {}

  // `!= null` (and not `!== undefined`): the API may return keys with `null`;
  // null in the merge would wipe valid form fields.
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

const normalizeVersion = (raw) => {
  if (!raw || typeof raw !== 'object') return raw

  // v6 version endpoints (create/clone/retrieve) wrap the version fields under
  // `meta`, e.g. `{ id: <numeric DB id>, version: 6, meta: { version_id, state, ... } }`.
  // Older/list payloads are flat. When the envelope exists, `meta.*` wins;
  // otherwise we fall back to the flat keys (where `version_state` precedes `state`).
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null

  // `config` carries the Application fields the form initializes from (merged
  // over the parent Application by the version adapter component). Empty `{}`
  // when the response carries metadata only.
  return {
    // Canonical identifier is the ULID/hash `version_id` of THIS version — it is
    // what goes in the URL, queryKey and payloads. Never navigate with the numeric
    // DB `id` nor `source_version_id` (the version it was cloned from): both open
    // the wrong/non-existent version. This is why a clone landed on the source.
    id: meta?.version_id ?? raw.version_id ?? raw.id,
    // The lifecycle state drives the whole VersionShell (editability, available
    // actions). v6 exposes it as `meta.state`; flat payloads use `version_state`
    // or `state`. Reading the wrong key makes `state` undefined, which downstream
    // defaults to `draft` and wrongly enables SAVE / SAVE_AND_BUILD on immutable
    // versions (e.g. `ready`).
    state: meta?.state ?? raw.version_state ?? raw.state,
    comment: meta?.description ?? raw.comment ?? '',
    createdAt: meta?.created_at ?? raw.created_at,
    lastModified: meta?.last_modified ?? raw.last_modified,
    config: normalizeConfig(raw)
  }
}

export const EdgeAppVersionAdapter = {
  /**
   * Normalizes a version envelope (`retrieve_application_version` /
   * `create_application_version` / `update_application_version`).
   *
   * Accepts both `{ data: {...} }` and a raw object.
   */
  transformLoadVersion(raw) {
    if (!raw) return raw
    const source = raw?.data ?? raw
    return normalizeVersion(source)
  },

  /**
   * Normalizes the paginated response of `list_application_versions`.
   * Returns `{ count, body }` for the v2 list-service contract.
   */
  transformListVersions(raw) {
    if (!raw) return { count: 0, body: [] }

    const results = Array.isArray(raw?.results) ? raw.results : Array.isArray(raw) ? raw : []
    const count = typeof raw?.count === 'number' ? raw.count : results.length

    return {
      count,
      body: results.map(normalizeVersion)
    }
  },

  /**
   * Converts the UI body into a snake_case payload for `create_application_version`.
   *
   * API contract (confirmed 2026-06-12): Application fields go at the ROOT of
   * the body, alongside `source_version` and `comment` — there is no `override`
   * wrapper. Omitting a field keeps the cloned value from `source_version`.
   */
  transformCreateDraftPayload(body = {}) {
    const payload = {}

    if (body.sourceVersionId !== undefined && body.sourceVersionId !== null) {
      payload.source_version = body.sourceVersionId
    }
    if (body.comment !== undefined && body.comment !== null) {
      payload.comment = body.comment
    }

    // Clone-with-changes: Application fields (name, modules, active, debug)
    // mapped at the root via EdgeAppAdapter.transformPayload (DRY), stripping
    // `undefined` so absent fields keep the cloned value.
    const appFields = stripUndefinedDeep(EdgeAppAdapter.transformPayload(body))
    if (appFields !== undefined) {
      Object.assign(payload, appFields)
    }

    return payload
  },

  /**
   * Converts UI form values into a PUT/PATCH payload for an existing draft.
   *
   * API contract (confirmed 2026-06-12): Application fields (name, modules,
   * active, debug) go at the ROOT of the body — there is no `override` wrapper.
   * `comment` and `source_version` also stay at the root. Fields are mapped via
   * `EdgeAppAdapter.transformPayload` (DRY) and `undefined` keys are recursively
   * removed to preserve PATCH's partial semantics.
   */
  transformDraftPayload(values = {}) {
    const payload = {}

    if (values.comment !== undefined) {
      payload.comment = values.comment
    }
    if (values.sourceVersionId !== undefined) {
      payload.source_version = values.sourceVersionId
    }

    const appFields = stripUndefinedDeep(EdgeAppAdapter.transformPayload(values))
    if (appFields !== undefined) {
      Object.assign(payload, appFields)
    }

    return payload
  },

  /**
   * Payload for `archive_application_version`. Comment is required at the
   * service level (validated before this adapter runs).
   */
  transformArchivePayload({ comment } = {}) {
    return { comment }
  },

  /**
   * Payload for `build_application_version` / `cancel_application_version_build`.
   * Both endpoints accept the same shape; the caller is responsible for ensuring
   * that `trace_id` exists when required.
   */
  transformBuildPayload({ trace_id, comment } = {}) {
    const payload = {}
    if (trace_id !== undefined && trace_id !== null) payload.trace_id = trace_id
    if (comment !== undefined && comment !== null) payload.comment = comment
    return payload
  }
}
