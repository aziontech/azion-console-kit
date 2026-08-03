/**
 * Deployment version contract.
 * Source: src/services/v2/deployment/deployment-version-adapter.js — this adapter
 * does NOT use createVersionAdapter, so its envelope diverges from the common one:
 *   IDENTITY: `id` (not version_id); no source_version_id / reference_count
 *   READ  (normalizeVersion): id, deployment_id, name, state (meta.version_state |
 *          meta.state | version_state | state), state_detail, description,
 *          updated_at|created_at, last_modified_by|created_by (email),
 *          resources[].{resource_type,resource_id,resource_name,resource_version_id}
 *   WRITE (normalizeDraftPayload): resources[].{id,resource_type}, strategy, origin
 *   WRITE (normalizeReasonPayload — build & archive): reason, comment (both optional)
 */
import * as yup from 'yup'
import { resolveState, VERSION_STATE_VALUES } from './version-common.schema'

const isPresent = (value) => value !== undefined && value !== null

const resourceShape = yup.object({
  resource_type: yup.string().nullable(),
  resource_id: yup.mixed().nullable(),
  resource_name: yup.string().nullable(),
  resource_version_id: yup.mixed().nullable()
})

export const versionResponse = yup
  .object({
    id: yup.mixed(),
    deployment_id: yup.mixed().nullable(),
    name: yup.string(),
    state: yup.string(),
    version_state: yup.string(),
    state_detail: yup.mixed().nullable(),
    description: yup.string(),
    created_at: yup.string().nullable(),
    updated_at: yup.string().nullable(),
    last_modified_by: yup.mixed().nullable(),
    created_by: yup.mixed().nullable(),
    resources: yup.array().of(resourceShape),
    meta: yup.object().nullable()
  })
  .test('deployment-id-present', 'deployment version id is required', (raw) =>
    isPresent(raw?.id ?? raw?.meta?.id)
  )
  .test('version-state-valid', 'version state must be one of the 8 canonical states', (raw) => {
    const state = resolveState(raw)
    return isPresent(state) && VERSION_STATE_VALUES.includes(state)
  })

// Deployment draft = resource selection, not a resource snapshot.
export const draftRequest = yup.object({
  resources: yup.array().of(
    yup.object({
      id: yup.mixed(),
      resource_type: yup.string()
    })
  ),
  strategy: yup.string(),
  origin: yup.mixed()
})

// Build and archive share the reason payload (both fields optional).
export const buildRequest = yup.object({
  reason: yup.string(),
  comment: yup.string()
})

export const archiveRequest = yup.object({
  reason: yup.string(),
  comment: yup.string()
})
