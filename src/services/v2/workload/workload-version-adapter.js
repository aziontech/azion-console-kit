import { createVersionAdapter, stripUndefinedDeep } from '@/services/v2/versioning/version-adapter'
import { WorkloadAdapter } from './workload-adapter'

const mapMeta = (raw) => ({
  deploymentId: raw.deployment_id ?? null,
  environmentId: raw.environment_id ?? null,
  lastError: raw.last_error ?? null
})

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}
  if (raw.protocols == null || raw.tls == null || raw.mtls == null) return {}
  return WorkloadAdapter.transformLoadWorkload({ data: raw }, undefined, [])
}

const mapResourceFields = (source = {}) => {
  if (source.name == null && source.protocols == null) return {}
  return WorkloadAdapter.transformCreateWorkload(source)
}

const base = createVersionAdapter({ normalizeConfig, mapResourceFields, mapMeta })

export const WorkloadVersionAdapter = {
  ...base,

  transformDraftPayload(values = {}) {
    const payload = stripUndefinedDeep(mapResourceFields(values)) ?? {}
    if (values.comment !== undefined) payload.comment = values.comment
    return payload
  },

  transformActionPayload({ comment } = {}) {
    const payload = {}
    if (comment != null) payload.comment = comment
    return payload
  },

  transformBuildPayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  },

  transformArchivePayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  }
}
