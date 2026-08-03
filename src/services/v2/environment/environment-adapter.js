import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const toStringArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
}

const POLICY_LABELS = {
  single_version: 'Single Version',
  versioned_urls: 'Versioned URLs'
}

export const mapPolicyToLabel = (policy) => {
  if (!policy) return ''
  return POLICY_LABELS[policy] ?? String(policy)
}

const normalizeProtection = (protection) => {
  const source = isObject(protection) ? protection : {}
  const azionAuthentication = isObject(source.azion_authentication)
    ? source.azion_authentication
    : {}
  const passwordProtection = isObject(source.password_protection) ? source.password_protection : {}
  const ipAllowlist = isObject(source.ip_allowlist) ? source.ip_allowlist : {}
  const ssoEnforcement = isObject(source.sso_enforcement) ? source.sso_enforcement : {}

  return {
    azion_authentication: {
      enabled: Boolean(azionAuthentication.enabled)
    },
    password_protection: {
      enabled: Boolean(passwordProtection.enabled),
      secret_id: passwordProtection.secret_id ?? null
    },
    ip_allowlist: {
      enabled: Boolean(ipAllowlist.enabled),
      cidrs: toStringArray(ipAllowlist.cidrs)
    },
    sso_enforcement: {
      enabled: Boolean(ssoEnforcement.enabled),
      idp_id: ssoEnforcement.idp_id ?? null,
      allowed_domains: toStringArray(ssoEnforcement.allowed_domains)
    }
  }
}

const normalizeAuditActor = (actor) => {
  if (!isObject(actor)) return null
  return {
    user_id: actor.user_id ?? null,
    trigger: actor.trigger ?? null,
    email: actor.email ?? null
  }
}

const normalizeBranchTracking = (branchTracking) => {
  if (branchTracking === null) return null
  if (!isObject(branchTracking)) return null

  return {
    enabled: Boolean(branchTracking.enabled),
    mode: branchTracking.mode ?? null,
    branch_match: branchTracking.branch_match ?? null
  }
}

const normalizeEnvironment = (environment) => {
  const source = isObject(environment) ? environment : {}

  return {
    id: source.id ?? null,
    name: source.name ?? '',
    description: source.description ?? null,
    deployment_policy: mapPolicyToLabel(source.deployment_policy),
    log_verbosity: typeof source.log_verbosity === 'string' ? source.log_verbosity : 'normal',
    robots_policy: typeof source.robots_policy === 'string' ? source.robots_policy : 'index',
    protection: normalizeProtection(source.protection),
    branch_tracking: normalizeBranchTracking(source.branch_tracking),
    state: source.state ?? null,
    state_detail: source.state_detail ?? null,
    client_id: source.client_id ?? null,
    created_at: source.created_at ?? null,
    last_modified: source.last_modified ?? source.updated_at ?? null,
    created_by: normalizeAuditActor(source.created_by),
    last_editor: source.last_editor ?? null
  }
}

const pickDefined = (payload) => {
  return Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value
    }

    return acc
  }, {})
}

export const EnvironmentAdapter = {
  transformList(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => {
      const normalized = normalizeEnvironment(item)
      const lastEditor = normalized.last_editor || '-'
      return {
        ...normalized,
        last_editor: lastEditor,
        last_modified: normalized.last_modified
          ? formatDateToDayMonthYearHour(normalized.last_modified)
          : '-'
      }
    })
  },

  transformItem(data) {
    if (!data) return null
    return normalizeEnvironment(data)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      deployment_policy: payload.deployment_policy,
      log_verbosity: payload.log_verbosity,
      robots_policy: payload.robots_policy,
      protection: payload.protection,
      branch_tracking: payload.branch_tracking
    })
  },

  transformPatchPayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      deployment_policy: payload.deployment_policy,
      log_verbosity: payload.log_verbosity,
      robots_policy: payload.robots_policy,
      protection: payload.protection,
      branch_tracking: payload.branch_tracking
    })
  }
}
