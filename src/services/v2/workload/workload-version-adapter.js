import { createVersionAdapter, stripUndefinedDeep } from '@/services/v2/versioning/version-adapter'
import { WorkloadAdapter } from './workload-adapter'

// Workload-only meta fields not modeled by the base normalizer: the deployment
// binding, the environment binding and the last build error.
const mapMeta = (raw) => ({
  deploymentId: raw.deployment_id ?? null,
  environmentId: raw.environment_id ?? null,
  lastError: raw.last_error ?? null
})

// transformLoadWorkload reads tls/protocols/mtls unconditionally, so only run it
// on a full resource snapshot; metadata-only payloads yield {} (form falls back
// to the parent workload).
const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}
  if (raw.protocols == null || raw.tls == null || raw.mtls == null) return {}
  return WorkloadAdapter.transformLoadWorkload({ data: raw }, undefined, [])
}

// A draft write is a full workload payload at the root (doc §2). Guarded so a bare
// clone (no name/protocols) skips transformCreateWorkload, which reads form fields
// unconditionally and would otherwise throw.
const mapResourceFields = (source = {}) => {
  if (source.name == null && source.protocols == null) return {}
  return WorkloadAdapter.transformCreateWorkload(source)
}

const base = createVersionAdapter({ normalizeConfig, mapResourceFields, mapMeta })

export const WorkloadVersionAdapter = {
  ...base,

  // PUT/POST on a draft = full workload payload at the root (doc §2). Reuses the
  // create transform so the version write mirrors the resource write exactly.
  transformDraftPayload(values = {}) {
    const payload = stripUndefinedDeep(mapResourceFields(values)) ?? {}
    if (values.comment !== undefined) payload.comment = values.comment
    return payload
  },

  // Rollback carries only an optional comment.
  transformActionPayload({ comment } = {}) {
    const payload = {}
    if (comment != null) payload.comment = comment
    return payload
  },

  // The inherited cancelBuild/archive read these; for a Workload both carry only an
  // optional comment, same as transformActionPayload.
  transformBuildPayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  },

  transformArchivePayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  }
}
