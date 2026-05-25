// MOCK: temporary fixture for the deployments listing.
// Shape mirrors the expected `/deployment-api/v1/deployments` response so the
// adapter contract stays identical when the real endpoint is wired in.

const PRIMARY_USER = 'rafael.umman@azion.com'

const isoFromBase = (hoursAgo = 0, minutesAgo = 0) => {
  const date = new Date('2026-05-15T14:00:25.000Z')
  date.setHours(date.getHours() - hoursAgo)
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

const baseAudit = (user = PRIMARY_USER, trigger = 'Console') => ({
  user_id: user,
  trigger
})

const baseStrategyDefaults = {
  canary: { enabled: false, default_percentage: 0 },
  skew_protection: { enabled: false, default_ttl_seconds: 3600 }
}

const buildDeployment = (overrides = {}) => ({
  id: '129318321',
  environment_id: 1,
  environment: 'production',
  name: 'deployment-release',
  description: null,
  active: true,
  is_current: false,
  duration_seconds: null,
  binding_policy: 'STRICT',
  deployment_version_policy: 'single_version',
  allowed_resource_types: ['edge_application'],
  strategy_defaults: baseStrategyDefaults,
  state: 'ready',
  state_detail: null,
  client_id: 'client-001',
  created_at: isoFromBase(0),
  updated_at: isoFromBase(0),
  created_by: baseAudit(),
  last_modified_by: baseAudit(),
  ...overrides
})

export const deploymentListMock = [
  buildDeployment({
    id: '129318321',
    environment: 'production',
    state: 'building',
    is_current: true,
    duration_seconds: null,
    updated_at: isoFromBase(0)
  }),
  buildDeployment({
    id: '129318322',
    environment: 'production',
    state: 'ready',
    duration_seconds: 99,
    updated_at: isoFromBase(1)
  }),
  buildDeployment({
    id: '129318323',
    environment: 'production',
    state: 'building',
    duration_seconds: null,
    updated_at: isoFromBase(2)
  }),
  buildDeployment({
    id: '129318324',
    environment: 'staging',
    state: 'error',
    duration_seconds: 42,
    updated_at: isoFromBase(3)
  }),
  buildDeployment({
    id: '129318325',
    environment: 'staging',
    state: 'queued',
    duration_seconds: null,
    updated_at: isoFromBase(4)
  }),
  buildDeployment({
    id: '129318326',
    environment: 'staging',
    state: 'draft',
    duration_seconds: null,
    updated_at: isoFromBase(5)
  }),
  buildDeployment({
    id: '129318327',
    environment: 'staging',
    state: 'draft',
    duration_seconds: null,
    updated_at: isoFromBase(6)
  }),
  buildDeployment({
    id: '129318328',
    environment: 'staging',
    state: 'draft',
    duration_seconds: null,
    updated_at: isoFromBase(7)
  }),
  buildDeployment({
    id: '129318329',
    environment: 'staging',
    state: 'draft',
    duration_seconds: null,
    updated_at: isoFromBase(8)
  }),
  buildDeployment({
    id: '129318330',
    environment: 'staging',
    state: 'canceled',
    duration_seconds: 12,
    updated_at: isoFromBase(9)
  }),
  buildDeployment({
    id: '129318331',
    environment: 'production',
    state: 'ready',
    duration_seconds: 99,
    updated_at: isoFromBase(10)
  })
]

export const deploymentListMockResponse = {
  results: deploymentListMock,
  count: deploymentListMock.length
}
