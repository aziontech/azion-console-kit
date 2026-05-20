// src/services/v2/environment/environment-mock.js

const getCurrentTimestamp = () => new Date().toISOString()

const simulateDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const ULID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

const generateUlid = () => {
  const bytes = new Uint8Array(26)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 26; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256)
    }
  }
  let id = ''
  for (let i = 0; i < 26; i += 1) {
    id += ULID_ALPHABET[bytes[i] % ULID_ALPHABET.length]
  }
  return id
}

const createMockApiError = ({ status, code, title, detail, pointer }) => {
  const error = new Error(detail || title)
  error.response = {
    status: Number(status),
    data: {
      errors: [
        {
          status: String(status),
          code,
          title,
          detail,
          ...(pointer ? { meta: { source: { pointer } } } : {})
        }
      ]
    }
  }
  return error
}

const MOCK_CLIENT_ID = '1234567'
const MOCK_USER_ID = 'usr_456'
const VALID_DVP = new Set(['single_version', 'versioned_urls'])
const VALID_LOG_VERBOSITY = new Set(['normal', 'verbose'])
const VALID_ROBOTS_POLICY = new Set(['index', 'noindex'])
const VALID_BRANCH_MODES = new Set(['branch_is', 'branch_starts_with', 'branch_ends_with'])

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
      cidrs: Array.isArray(source?.ip_allowlist?.cidrs) ? source.ip_allowlist.cidrs.map(String) : []
    },
    sso_enforcement: {
      enabled: Boolean(source?.sso_enforcement?.enabled),
      idp_id: source?.sso_enforcement?.idp_id ?? null,
      allowed_domains: Array.isArray(source?.sso_enforcement?.allowed_domains)
        ? source.sso_enforcement.allowed_domains.map(String)
        : []
    }
  }
}

const normalizeBranchTracking = (branchTracking) => {
  if (branchTracking === null) return null
  if (!branchTracking || typeof branchTracking !== 'object') return null

  return {
    enabled: Boolean(branchTracking.enabled),
    mode: branchTracking.mode ?? 'branch_is',
    branch_match: branchTracking.branch_match ?? null
  }
}

const normalizeEnvironment = (environment) => {
  const source = environment && typeof environment === 'object' ? environment : {}

  return {
    id: source.id ?? null,
    name: source.name ?? '',
    description: source.description ?? null,
    deployment_version_policy: source.deployment_version_policy,
    log_verbosity:
      typeof source.log_verbosity === 'string' && VALID_LOG_VERBOSITY.has(source.log_verbosity)
        ? source.log_verbosity
        : 'normal',
    robots_policy:
      typeof source.robots_policy === 'string' && VALID_ROBOTS_POLICY.has(source.robots_policy)
        ? source.robots_policy
        : 'index',
    protection: normalizeProtection(source.protection),
    branch_tracking: normalizeBranchTracking(source.branch_tracking),
    state: source.state ?? 'ready',
    state_detail: source.state_detail ?? null,
    client_id: source.client_id ?? MOCK_CLIENT_ID,
    created_at: source.created_at ?? null,
    updated_at: source.updated_at ?? null,
    created_by: source.created_by ?? MOCK_USER_ID,
    last_editor: source.last_editor ?? null
  }
}

let environments = [
  normalizeEnvironment({
    id: '01HRXENVPRD0000000000000000',
    name: 'Production',
    description: 'Primary production environment',
    deployment_version_policy: 'single_version',
    log_verbosity: 'normal',
    robots_policy: 'index',
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
    state: 'ready',
    state_detail: null,
    client_id: MOCK_CLIENT_ID,
    created_at: '2026-03-26T18:00:00Z',
    updated_at: '2026-03-26T18:00:00Z',
    created_by: MOCK_USER_ID,
    last_editor: 'guilherme.santana@azion.com'
  }),
  normalizeEnvironment({
    id: '01HRXENVSTG0000000000000000',
    name: 'Staging',
    description: 'Pre-production validation environment',
    deployment_version_policy: 'versioned_urls',
    log_verbosity: 'verbose',
    robots_policy: 'noindex',
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
    state: 'ready',
    state_detail: null,
    client_id: MOCK_CLIENT_ID,
    created_at: '2026-03-26T18:00:00Z',
    updated_at: '2026-03-26T18:00:00Z',
    created_by: MOCK_USER_ID,
    last_editor: 'guilherme.santana@azion.com'
  })
]

const scheduleLifecycle = (id) => {
  setTimeout(() => {
    const env = environments.find((item) => item.id === id)
    if (env && env.state === 'queued') env.state = 'building'
  }, 800)
  setTimeout(() => {
    const env = environments.find((item) => item.id === id)
    if (env && env.state === 'building') env.state = 'ready'
  }, 1800)
}

export const listEnvironmentsService = async (params = {}) => {
  await simulateDelay()

  const page = Number(params.page) > 0 ? Number(params.page) : 1
  const pageSize = Number(params.page_size) > 0 ? Math.min(Number(params.page_size), 100) : 20
  const nameFilter = typeof params.name === 'string' ? params.name.toLowerCase() : ''

  const filtered = nameFilter
    ? environments.filter((env) => (env.name || '').toLowerCase().includes(nameFilter))
    : environments

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const slice = filtered.slice(start, start + pageSize)

  return {
    count: total,
    total_pages: totalPages,
    page,
    page_size: pageSize,
    next: page < totalPages ? `mock://environments?page=${page + 1}&page_size=${pageSize}` : null,
    previous: page > 1 ? `mock://environments?page=${page - 1}&page_size=${pageSize}` : null,
    results: slice
  }
}

export const createEnvironmentService = async (payload = {}) => {
  await simulateDelay()

  if (typeof payload.name !== 'string' || payload.name.length < 3 || payload.name.length > 255) {
    throw createMockApiError({
      status: 400,
      code: 'AZN-DEPLOYMENT-VALIDATION-001',
      title: 'Validation error',
      detail: 'name must be between 3 and 255 characters',
      pointer: '/name'
    })
  }

  if (!VALID_DVP.has(payload.deployment_version_policy)) {
    throw createMockApiError({
      status: 400,
      code: 'AZN-DEPLOYMENT-VALIDATION-002',
      title: 'Validation error',
      detail:
        'deployment_version_policy is required and must be one of: single_version, versioned_urls',
      pointer: '/deployment_version_policy'
    })
  }

  if (
    payload.branch_tracking &&
    payload.branch_tracking.mode &&
    !VALID_BRANCH_MODES.has(payload.branch_tracking.mode)
  ) {
    throw createMockApiError({
      status: 400,
      code: 'AZN-DEPLOYMENT-VALIDATION-002',
      title: 'Validation error',
      detail: 'branch_tracking.mode must be branch_is, branch_starts_with or branch_ends_with',
      pointer: '/branch_tracking/mode'
    })
  }

  const timestamp = getCurrentTimestamp()
  const id = generateUlid()

  const newEnvironment = normalizeEnvironment({
    id,
    name: payload.name,
    description: payload.description ?? null,
    deployment_version_policy: payload.deployment_version_policy,
    log_verbosity: payload.log_verbosity ?? 'normal',
    robots_policy: payload.robots_policy ?? 'index',
    protection: payload.protection,
    branch_tracking: payload.branch_tracking === null ? null : (payload.branch_tracking ?? null),
    state: 'queued',
    state_detail: null,
    client_id: MOCK_CLIENT_ID,
    created_at: timestamp,
    updated_at: null,
    created_by: MOCK_USER_ID,
    last_editor: null
  })

  environments.push(newEnvironment)
  scheduleLifecycle(id)

  return { state: 'executed', data: newEnvironment }
}

export const updateEnvironmentService = async (id, payload = {}) => {
  await simulateDelay()

  const index = environments.findIndex((env) => env.id === id)

  if (index === -1) {
    throw createMockApiError({
      status: 404,
      code: 'AZN-DEPLOYMENT-NOT_FOUND-001',
      title: 'Not found',
      detail: `Environment ${id} not found`
    })
  }

  const current = environments[index]

  if (
    payload.deployment_version_policy !== undefined &&
    payload.deployment_version_policy !== current.deployment_version_policy
  ) {
    throw createMockApiError({
      status: 409,
      code: 'AZN-DEPLOYMENT-CONFLICT-001',
      title: 'Conflict',
      detail: 'deployment_version_policy is immutable and cannot be changed',
      pointer: '/deployment_version_policy'
    })
  }

  if (
    payload.branch_tracking &&
    payload.branch_tracking.mode &&
    !VALID_BRANCH_MODES.has(payload.branch_tracking.mode)
  ) {
    throw createMockApiError({
      status: 400,
      code: 'AZN-DEPLOYMENT-VALIDATION-002',
      title: 'Validation error',
      detail: 'branch_tracking.mode must be branch_is, branch_starts_with or branch_ends_with',
      pointer: '/branch_tracking/mode'
    })
  }

  const timestamp = getCurrentTimestamp()

  const updated = normalizeEnvironment({
    ...current,
    name: payload.name ?? current.name,
    description: payload.description ?? current.description,
    deployment_version_policy: current.deployment_version_policy,
    log_verbosity: payload.log_verbosity ?? current.log_verbosity,
    robots_policy: payload.robots_policy ?? current.robots_policy,
    protection: payload.protection ?? current.protection,
    branch_tracking:
      payload.branch_tracking === undefined ? current.branch_tracking : payload.branch_tracking,
    state: current.state,
    state_detail: current.state_detail,
    client_id: current.client_id,
    created_at: current.created_at,
    updated_at: timestamp,
    created_by: current.created_by,
    last_editor: payload.last_editor ?? 'guilherme.santana@azion.com'
  })

  environments[index] = updated

  return { state: 'executed', data: updated }
}

export const deleteEnvironmentService = async (id) => {
  await simulateDelay()

  const index = environments.findIndex((env) => env.id === id)

  if (index === -1) {
    throw createMockApiError({
      status: 404,
      code: 'AZN-DEPLOYMENT-NOT_FOUND-001',
      title: 'Not found',
      detail: `Environment ${id} not found`
    })
  }

  environments.splice(index, 1)

  return undefined
}

export const getEnvironmentByIdService = async (id) => {
  await simulateDelay()

  const environment = environments.find((env) => env.id === id)

  if (!environment) {
    throw createMockApiError({
      status: 404,
      code: 'AZN-DEPLOYMENT-NOT_FOUND-001',
      title: 'Not found',
      detail: `Environment ${id} not found`
    })
  }

  return { state: 'executed', data: environment }
}
