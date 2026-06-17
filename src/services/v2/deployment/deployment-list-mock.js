// MOCK: temporary fixture for the deployments listing.
// Shape mirrors the `/deployment-api/v1/deployments` response documented at
// docs/ENDPOINTS.md (lines 337-428) so the adapter contract stays identical
// when USE_LIST_MOCK is flipped off and the real endpoint is wired in.

const PRIMARY_USER = {
  user_id: '456',
  trigger: 'console',
  email: 'rafael.umman@azion.com'
}

const isoFromBase = (hoursAgo = 0, minutesAgo = 0) => {
  const date = new Date('2026-05-15T14:00:25.000Z')
  date.setHours(date.getHours() - hoursAgo)
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

const baseStrategyDefaults = {
  canary: { enabled: false, default_percentage: 0 },
  skew_protection: { enabled: false, default_ttl_seconds: 3600 }
}

const buildDeployment = (overrides = {}) => ({
  id: '01HRX8W6S3M9A4K7P2Q5T8Z1YB',
  name: 'deployment-release',
  description: null,
  binding_policy: 'STRICT',
  deployment_version_policy: 'single_version',
  allowed_resource_types: ['application'],
  strategy_defaults: baseStrategyDefaults,
  state: 'ready',
  state_detail: null,
  client_id: '1234567',
  created_at: isoFromBase(0),
  updated_at: isoFromBase(0),
  created_by: { ...PRIMARY_USER },
  last_modified_by: { ...PRIMARY_USER },
  ...overrides
})

export const deploymentListMock = [
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YB',
    name: 'magalu-storefront',
    description: 'Public-facing storefront deployment',
    allowed_resource_types: ['application', 'firewall', 'custom_page'],
    state: 'ready',
    updated_at: isoFromBase(0)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YC',
    name: 'release-payments-gateway',
    description: 'Payments gateway rollout',
    deployment_version_policy: 'versioned_urls',
    allowed_resource_types: ['application', 'function'],
    state: 'ready',
    updated_at: isoFromBase(1),
    last_modified_by: {
      user_id: '789',
      trigger: 'cli',
      email: 'lucas.martins@azion.com'
    }
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YD',
    name: 'feature-cart-promotions',
    allowed_resource_types: ['application', 'firewall'],
    state: 'building',
    updated_at: isoFromBase(2)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YE',
    name: 'hotfix-auth-session-expiry',
    deployment_version_policy: 'versioned_urls',
    allowed_resource_types: ['application', 'firewall', 'function', 'network_list'],
    state: 'error',
    state_detail: 'Catalog validation failed: function not found',
    updated_at: isoFromBase(3),
    last_modified_by: {
      user_id: '321',
      trigger: 'terraform',
      email: 'sophia.hernandez@azion.com'
    }
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YF',
    name: 'feature-search-suggestions',
    allowed_resource_types: ['application', 'function'],
    state: 'queued',
    updated_at: isoFromBase(4)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YG',
    name: 'experiment-homepage-banner',
    description: 'A/B test for the new homepage hero',
    allowed_resource_types: ['application', 'custom_page'],
    state: 'draft',
    updated_at: isoFromBase(5),
    last_modified_by: {
      user_id: '654',
      trigger: 'console',
      email: 'ethan.jones@azion.com'
    }
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YH',
    name: 'chore-update-dependencies',
    allowed_resource_types: ['application'],
    state: 'draft',
    updated_at: isoFromBase(6)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YJ',
    name: 'feature-profile-settings',
    deployment_version_policy: 'versioned_urls',
    allowed_resource_types: ['application', 'firewall', 'custom_page'],
    state: 'draft',
    updated_at: isoFromBase(7),
    last_modified_by: {
      user_id: '987',
      trigger: 'console',
      email: 'amira.khan@azion.com'
    }
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YK',
    name: 'refactor-checkout-validation',
    allowed_resource_types: ['application', 'function'],
    state: 'draft',
    updated_at: isoFromBase(8)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YM',
    name: 'rollback-shipping-rates',
    allowed_resource_types: ['application', 'firewall'],
    state: 'canceled',
    updated_at: isoFromBase(9)
  }),
  buildDeployment({
    id: '01HRX8W6S3M9A4K7P2Q5T8Z1YN',
    name: 'release-observability-stack',
    deployment_version_policy: 'versioned_urls',
    allowed_resource_types: ['application', 'function', 'network_list'],
    state: 'ready',
    updated_at: isoFromBase(10),
    last_modified_by: {
      user_id: '789',
      trigger: 'cli',
      email: 'lucas.martins@azion.com'
    }
  })
]

export const deploymentListMockResponse = {
  results: deploymentListMock,
  count: deploymentListMock.length
}
