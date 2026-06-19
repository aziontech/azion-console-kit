import { WorkloadAdapter } from './workload-adapter'

const stripUndefinedDeep = (obj) => {
  if (obj === undefined) return undefined
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return obj

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = stripUndefinedDeep(value)
    if (cleaned !== undefined) result[key] = cleaned
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const normalizeMeta = (raw) => {
  if (!raw || typeof raw !== 'object') return raw

  return {
    id: raw.version_id ?? raw.id,
    state: raw.state,
    version: raw.version ?? null,
    comment: raw.description ?? '',
    createdAt: raw.created_at ?? null,
    readyAt: raw.ready_at ?? null,
    lastModified: raw.last_modified ?? raw.ready_at ?? raw.created_at ?? null,
    lastEditor: raw.last_editor ?? null,
    deploymentId: raw.deployment_id ?? null,
    environmentId: raw.environment_id ?? null,
    sourceVersionId: raw.source_version_id ?? null,
    lastError: raw.last_error ?? null
  }
}

const normalizeConfig = (raw) => {
  if (!raw || typeof raw !== 'object') return {}
  // transformLoadWorkload reads tls/protocols/mtls unconditionally, so only run it
  // on a full resource snapshot; metadata-only payloads yield {} (form falls back
  // to the parent workload).
  if (raw.protocols == null || raw.tls == null || raw.mtls == null) return {}
  return WorkloadAdapter.transformLoadWorkload({ data: raw }, undefined, [])
}

const normalizeVersion = (raw) => {
  if (!raw || typeof raw !== 'object') return raw

  return {
    ...normalizeMeta(raw),
    config: normalizeConfig(raw)
  }
}

export const WorkloadVersionAdapter = {
  transformListVersions(raw) {
    if (!raw) return { count: 0, body: [] }

    const source = raw?.data ?? raw
    const results = Array.isArray(source?.results)
      ? source.results
      : Array.isArray(source)
        ? source
        : []
    const count = typeof source?.count === 'number' ? source.count : results.length

    return {
      count,
      body: results.map(normalizeMeta)
    }
  },

  transformLoadVersion(raw) {
    if (!raw) return raw
    const source = raw?.data ?? raw
    return normalizeVersion(source)
  },

  // PUT/POST on a draft = full workload payload at the root (doc §2). Reuses the
  // create transform so the version write mirrors the resource write exactly.
  transformDraftPayload(values = {}) {
    const payload = stripUndefinedDeep(WorkloadAdapter.transformCreateWorkload(values)) ?? {}
    if (values.comment !== undefined) payload.comment = values.comment
    return payload
  },

  // Clone: `source_version` + optional field overrides (doc §2). Bindings/domains
  // are inherited from the source, so the override stays minimal unless the caller
  // passes full form values.
  transformCreateDraftPayload(body = {}) {
    const payload = {}

    if (body.sourceVersionId != null) payload.source_version = body.sourceVersionId
    if (body.comment != null) payload.comment = body.comment

    if (body.name != null || body.protocols != null) {
      const fields = stripUndefinedDeep(WorkloadAdapter.transformCreateWorkload(body))
      if (fields !== undefined) Object.assign(payload, fields)
    }

    return payload
  },

  transformActionPayload({ comment } = {}) {
    const payload = {}
    if (comment != null) payload.comment = comment
    return payload
  },

  // The inherited cancelBuild/archive (VersionServiceBase) read these; for a
  // Workload both carry only an optional comment, same as transformActionPayload.
  transformBuildPayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  },

  transformArchivePayload({ comment } = {}) {
    return comment != null ? { comment } : {}
  }
}
