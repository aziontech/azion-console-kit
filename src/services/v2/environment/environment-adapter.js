const isObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const toStringArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
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

const normalizeBranchTracking = (branchTracking) => {
  const source = isObject(branchTracking) ? branchTracking : {}

  return {
    enabled: Boolean(source.enabled),
    mode: source.mode ?? null,
    branch_match: source.branch_match ?? null
  }
}

const normalizeEnvironment = (environment) => {
  const source = isObject(environment) ? environment : {}

  return {
    id: source.id ?? null,
    name: source.name ?? '',
    description: source.description ?? '',
    active: Boolean(source.active),
    deployment_version_policy: source.deployment_version_policy,
    log_verbosity: toStringArray(source.log_verbosity),
    robots_policy: toStringArray(source.robots_policy),
    protection: normalizeProtection(source.protection),
    branch_tracking: normalizeBranchTracking(source.branch_tracking),
    created_at: source.created_at ?? null,
    updated_at: source.updated_at ?? null,
    created_by: source.created_by ?? null,
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
    return data.map((item) => normalizeEnvironment(item))
  },

  transformItem(data) {
    if (!data) return null
    return normalizeEnvironment(data)
  },

  transformCreatePayload(payload = {}) {
    return pickDefined({
      name: payload.name,
      description: payload.description,
      active: payload.active,
      deployment_version_policy: payload.deployment_version_policy,
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
      active: payload.active,
      log_verbosity: payload.log_verbosity,
      robots_policy: payload.robots_policy,
      protection: payload.protection,
      branch_tracking: payload.branch_tracking
    })
  }
}
