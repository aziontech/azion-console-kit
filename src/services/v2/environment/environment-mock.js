// src/services/v2/environment/environment-mock.js

const getCurrentTimestamp = () => new Date().toISOString()

const simulateDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const toStringArray = (value) => {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item))
}

const normalizeProtection = (protection) => {
  const source = protection && typeof protection === 'object' ? protection : {}

  return {
    azion_authentication: {
      enabled: Boolean(source?.azion_authentication?.enabled)
    },
    password_protection: {
      enabled: Boolean(source?.password_protection?.enabled),
      secret_id: source?.password_protection?.secret_id ?? null
    },
    ip_allowlist: {
      enabled: Boolean(source?.ip_allowlist?.enabled),
      cidrs: toStringArray(source?.ip_allowlist?.cidrs)
    },
    sso_enforcement: {
      enabled: Boolean(source?.sso_enforcement?.enabled),
      idp_id: source?.sso_enforcement?.idp_id ?? null,
      allowed_domains: toStringArray(source?.sso_enforcement?.allowed_domains)
    }
  }
}

const normalizeBranchTracking = (branchTracking) => {
  const source = branchTracking && typeof branchTracking === 'object' ? branchTracking : {}

  return {
    enabled: Boolean(source.enabled),
    mode: source.mode ?? 'branch_is',
    branch_match: source.branch_match ?? 'main'
  }
}

const normalizeEnvironment = (environment) => {
  const source = environment && typeof environment === 'object' ? environment : {}

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

let environments = [
  normalizeEnvironment({
    id: 'env_01HXYZABCDEF',
    name: 'Production',
    description: 'Primary production environment',
    active: true,
    deployment_version_policy: 'single_version',
    log_verbosity: ['normal'],
    robots_policy: ['index'],
    protection: {
      azion_authentication: { enabled: true },
      password_protection: { enabled: false, secret_id: null },
      ip_allowlist: { enabled: true, cidrs: ['203.0.113.10/32'] },
      sso_enforcement: {
        enabled: false,
        idp_id: null,
        allowed_domains: []
      }
    },
    branch_tracking: {
      enabled: true,
      mode: 'branch_is',
      branch_match: 'main'
    },
    created_at: '2026-03-26T18:00:00Z',
    updated_at: '2026-03-26T18:00:00Z',
    created_by: 'system',
    last_editor: 'guilherme.santana@azion.com'
  }),
  normalizeEnvironment({
    id: 'env_01HXYZABCDEG',
    name: 'Staging',
    description: 'Pre-production validation environment',
    active: true,
    deployment_version_policy: 'versioned_urls',
    log_verbosity: ['verbose'],
    robots_policy: ['noindex'],
    protection: {
      azion_authentication: { enabled: false },
      password_protection: { enabled: false, secret_id: null },
      ip_allowlist: { enabled: false, cidrs: [] },
      sso_enforcement: {
        enabled: false,
        idp_id: null,
        allowed_domains: []
      }
    },
    branch_tracking: {
      enabled: true,
      mode: 'branch_is',
      branch_match: 'develop'
    },
    created_at: '2026-03-26T18:00:00Z',
    updated_at: '2026-03-26T18:00:00Z',
    created_by: 'system',
    last_editor: 'guilherme.santana@azion.com'
  })
]

let nextId = 3

const createEnvironmentId = () => `env_mock_${String(nextId++).padStart(6, '0')}`

export const listEnvironmentsService = async () => {
  await simulateDelay()

  return {
    count: environments.length,
    body: environments
  }
}

export const createEnvironmentService = async (payload = {}) => {
  await simulateDelay()
  const timestamp = getCurrentTimestamp()

  const newEnvironment = normalizeEnvironment({
    id: createEnvironmentId(),
    name: payload.name,
    description: payload.description,
    active: payload.active,
    deployment_version_policy: payload.deployment_version_policy,
    log_verbosity: payload.log_verbosity,
    robots_policy: payload.robots_policy,
    protection: payload.protection,
    branch_tracking: payload.branch_tracking,
    created_at: timestamp,
    updated_at: timestamp,
    created_by: payload.created_by ?? 'system',
    last_editor: payload.last_editor ?? 'guilherme.santana@azion.com'
  })

  environments.push(newEnvironment)

  return { data: newEnvironment }
}

export const updateEnvironmentService = async (id, payload = {}) => {
  await simulateDelay()

  const index = environments.findIndex((env) => env.id === id)

  if (index === -1) {
    throw new Error('Environment not found')
  }

  const current = environments[index]
  const timestamp = getCurrentTimestamp()

  const updated = normalizeEnvironment({
    ...current,
    name: payload.name ?? current.name,
    description: payload.description ?? current.description,
    active: payload.active ?? current.active,
    deployment_version_policy: current.deployment_version_policy,
    log_verbosity: payload.log_verbosity ?? current.log_verbosity,
    robots_policy: payload.robots_policy ?? current.robots_policy,
    protection: payload.protection ?? current.protection,
    branch_tracking: payload.branch_tracking ?? current.branch_tracking,
    created_at: current.created_at,
    updated_at: timestamp,
    created_by: current.created_by,
    last_editor: payload.last_editor ?? 'guilherme.santana@azion.com'
  })

  environments[index] = updated

  return { data: updated }
}

export const deleteEnvironmentService = async (id) => {
  await simulateDelay()

  const index = environments.findIndex((env) => env.id === id)

  if (index === -1) {
    throw new Error('Environment not found')
  }

  environments.splice(index, 1)

  return { success: true }
}

export const getEnvironmentByIdService = async (id) => {
  await simulateDelay()

  const environment = environments.find((env) => env.id === id)

  if (!environment) {
    throw new Error('Environment not found')
  }

  return { data: environment }
}
