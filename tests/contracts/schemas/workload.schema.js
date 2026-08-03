/**
 * Workload version contract.
 * Source: src/services/v2/workload/workload-version-adapter.js
 *   READ  (mapMeta): deployment_id, environment_id, last_error
 *   READ  (normalizeConfig guard): protocols, tls, mtls must be present, then
 *          WorkloadAdapter.transformLoadWorkload reads name/active/infrastructure/...
 *   WRITE (transformDraftPayload = WorkloadAdapter.transformCreateWorkload + comment):
 *          name, active, infrastructure, protocols, mtls at the root
 * Overrides the common build/archive (both carry only an optional comment).
 */
import * as yup from 'yup'
import { versionCommonResponse, draftRequestCommon } from './version-common.schema'

export const versionResponse = versionCommonResponse.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    infrastructure: yup.mixed(),
    protocols: yup.object(),
    tls: yup.object(),
    mtls: yup.object(),
    deployment_id: yup.mixed().nullable(),
    environment_id: yup.mixed().nullable(),
    last_error: yup.mixed().nullable()
  })
)

export const draftRequest = draftRequestCommon.concat(
  yup.object({
    name: yup.string(),
    active: yup.boolean(),
    infrastructure: yup.mixed(),
    protocols: yup.object(),
    mtls: yup.object()
  })
)

// Workload build/archive both write only an optional comment (no trace_id, and
// comment is NOT required — matching the adapter overrides).
export const buildRequest = yup.object({ comment: yup.string() })
export const archiveRequest = yup.object({ comment: yup.string() })
