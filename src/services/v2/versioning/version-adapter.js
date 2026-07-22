export const stripUndefinedDeep = (obj) => {
  if (obj === undefined) return undefined
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(stripUndefinedDeep).filter((item) => item !== undefined)
  }

  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const cleaned = stripUndefinedDeep(value)
    if (cleaned !== undefined) result[key] = cleaned
  }

  return Object.keys(result).length > 0 ? result : undefined
}

const unwrap = (raw) => raw?.data ?? raw

const isDefined = (value) => value !== undefined && value !== null

export const createVersionAdapter = ({ normalizeConfig, mapResourceFields, mapMeta } = {}) => {
  const toConfig = typeof normalizeConfig === 'function' ? normalizeConfig : () => ({})
  const toFields = typeof mapResourceFields === 'function' ? mapResourceFields : () => ({})
  const toMeta = typeof mapMeta === 'function' ? mapMeta : null

  const normalizeVersion = (raw) => {
    if (!raw || typeof raw !== 'object') return raw
    const meta = raw.meta && typeof raw.meta === 'object' ? raw.meta : null

    const baseMeta = {
      id: meta?.version_id ?? raw.version_id ?? raw.id,
      state: meta?.version_state ?? meta?.state ?? raw.version_state ?? raw.state,
      version: meta?.version ?? raw.version ?? null,
      comment: meta?.description ?? raw.description ?? raw.comment ?? '',
      createdAt: meta?.created_at ?? raw.created_at ?? null,
      readyAt: meta?.ready_at ?? raw.ready_at ?? null,
      lastModified:
        meta?.last_modified ?? raw.last_modified ?? raw.ready_at ?? raw.created_at ?? null,
      lastEditor: meta?.last_editor ?? raw.last_editor ?? null,
      sourceVersionId: meta?.source_version_id ?? raw.source_version_id ?? null,
      referenceCount: meta?.reference_count ?? raw.reference_count ?? null
    }

    return {
      ...baseMeta,
      ...(toMeta ? toMeta(raw) : {}),
      config: toConfig(raw)
    }
  }

  return {
    normalizeVersion,

    transformLoadVersion(raw) {
      if (!raw) return raw
      return normalizeVersion(unwrap(raw))
    },

    transformListVersions(raw) {
      if (!raw) return { count: 0, body: [] }
      const source = unwrap(raw)
      const results = Array.isArray(source?.results)
        ? source.results
        : Array.isArray(source)
          ? source
          : []
      const count = typeof source?.count === 'number' ? source.count : results.length
      return { count, body: results.map(normalizeVersion) }
    },

    transformCreateDraftPayload(body = {}) {
      const payload = {}
      if (isDefined(body.sourceVersionId)) payload.source_version = body.sourceVersionId
      if (isDefined(body.comment)) payload.comment = body.comment

      const fields = stripUndefinedDeep(toFields(body))
      if (fields !== undefined) Object.assign(payload, fields)
      return payload
    },

    transformDraftPayload(values = {}) {
      const payload = {}
      if (values.comment !== undefined) payload.comment = values.comment
      if (values.sourceVersionId !== undefined) payload.source_version = values.sourceVersionId

      const fields = stripUndefinedDeep(toFields(values))
      if (fields !== undefined) Object.assign(payload, fields)
      return payload
    },

    transformArchivePayload({ comment } = {}) {
      return { comment }
    },

    transformBuildPayload({ trace_id, comment } = {}) {
      const payload = {}
      if (isDefined(trace_id)) payload.trace_id = trace_id
      if (isDefined(comment)) payload.comment = comment
      return payload
    }
  }
}
