/**
 * Common version contract — the single source of truth for the part of a
 * versioned-resource response that EVERY resource shares, plus the shared
 * request payloads.
 *
 * Derived strictly from the real adapters on this branch:
 *   - src/services/v2/versioning/version-adapter.js (createVersionAdapter)
 *   - src/composables/versioning/version-machine.js  (VERSION_STATES)
 *
 * Envelope precedence mirrors `normalizeVersion`: `meta.*` wins, then the flat
 * keys (`version_state` before `state`). Identity is the per-version id
 * (`meta.version_id ?? version_id ?? id`), NOT the base resource id.
 *
 * Response schemas do NOT use `noUnknown`: the API may return extra fields the
 * front ignores. We only assert presence/type of what the adapter READS.
 * Request schemas may be stricter (they describe what the adapter WRITES).
 */
import * as yup from 'yup'
import { VERSION_STATES } from '../../../src/composables/versioning/version-machine'

/** The 8 canonical states the Version API returns (single source of truth). */
export const VERSION_STATE_VALUES = Object.values(VERSION_STATES)

/**
 * Resolves the effective version state with the same precedence the base
 * adapter uses, so the contract test validates exactly what the front reads.
 * @param {Record<string, unknown>} raw
 * @returns {unknown}
 */
export const resolveState = (raw) => {
  if (!raw || typeof raw !== 'object') return undefined
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null
  return meta?.version_state ?? meta?.state ?? raw.version_state ?? raw.state
}

/**
 * Resolves the effective version identity with the base adapter's precedence.
 * @param {Record<string, unknown>} raw
 * @returns {unknown}
 */
export const resolveVersionId = (raw) => {
  if (!raw || typeof raw !== 'object') return undefined
  const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null
  return meta?.version_id ?? raw.version_id ?? raw.id
}

const isPresent = (value) => value !== undefined && value !== null

/**
 * Envelope every versioned response shares. Fields are optional/typed because
 * they arrive either flat or nested under `meta`; the two object-level tests
 * enforce the invariants the front actually depends on (identity + valid
 * state). Extra unknown fields are allowed on purpose.
 */
export const versionCommonResponse = yup
  .object({
    id: yup.mixed(),
    version_id: yup.string(),
    state: yup.string(),
    version_state: yup.string(),
    version: yup.number().nullable(),
    comment: yup.string(),
    description: yup.string(),
    created_at: yup.string().nullable(),
    ready_at: yup.string().nullable(),
    last_modified: yup.string().nullable(),
    last_editor: yup.string().nullable(),
    source_version_id: yup.string().nullable(),
    reference_count: yup.number().nullable(),
    meta: yup.object().nullable()
  })
  .test(
    'version-identity-present',
    'version identity (meta.version_id | version_id | id) is required',
    (raw) => isPresent(resolveVersionId(raw))
  )
  .test('version-state-valid', 'version state must be one of the 8 canonical states', (raw) => {
    const state = resolveState(raw)
    return isPresent(state) && VERSION_STATE_VALUES.includes(state)
  })

/**
 * Common draft request fields the base adapter writes at the root
 * (`transformCreateDraftPayload` / `transformDraftPayload`). Resource schemas
 * concat their own root fields onto this.
 */
export const draftRequestCommon = yup.object({
  comment: yup.string(),
  source_version: yup.string()
})

/**
 * Build request — base `transformBuildPayload` writes an optional trace id and
 * comment at the root.
 */
export const buildRequestCommon = yup.object({
  trace_id: yup.string(),
  comment: yup.string()
})

/**
 * Archive request — base `transformArchivePayload` always emits `comment` at
 * the root, so it is required in the canonical contract. Resources that override
 * the transform (Workload, Deployment) provide their own archive schema.
 */
export const archiveRequestCommon = yup
  .object({
    comment: yup.string().required()
  })
  .noUnknown()
