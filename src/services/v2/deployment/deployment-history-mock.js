// MOCK: temporary fixture for `GET /v1/deployments/history`. Shape mirrors
// docs/ENDPOINTS.md lines 862-897. Remove the toggle in
// `deployment-history-service.js` once the API is wired in.

const baseStrategy = {
  rollout_mode: 'INSTANT',
  gradual_rollout: {
    enabled: false,
    candidate_percentage: null,
    candidate_cookie_name: null,
    candidate_cookie_max_age_seconds: null,
    candidate_from_deployment_version_id: null
  },
  skew_protection: {
    enabled: true,
    cookie_name: '__azdeploy_skew',
    max_age_seconds: 3600,
    max_skewed_deployments: 20
  }
}

const isoFromBase = (hoursAgo = 0, minutesAgo = 0) => {
  const date = new Date('2026-05-15T14:00:25.000Z')
  date.setHours(date.getHours() - hoursAgo)
  date.setMinutes(date.getMinutes() - minutesAgo)
  return date.toISOString()
}

const defaultResources = [
  {
    resource_type: 'application',
    resource_id: '01HRX900APP000000000000001',
    resource_version_id: 'v1.4.2',
    resource_name: 'checkout-app'
  },
  {
    resource_type: 'firewall',
    resource_id: '01HRX900FWL000000000000001',
    resource_version_id: 'v2.0.1',
    resource_name: 'edge-firewall-prod'
  }
]

const buildVersion = (overrides = {}) => {
  const requestedAt = overrides.requested_at ?? overrides.created_at ?? isoFromBase(0)
  const readyAt = overrides.ready_at ?? null
  return {
    id: overrides.id ?? '01HRX92PS4N7D3M2Y8T6Q1K5VC',
    deployment_id: overrides.deployment_id ?? '01HRX8W6S3M9A4K7P2Q5T8Z1YB',
    // Synthetic display name (UI-only — the API contract for versions doesn't
    // include a name field; we surface this here so the row's primary label
    // reads as a human-friendly version label instead of the ULID.
    name: overrides.name ?? 'deployment-version',
    resources: overrides.resources ?? defaultResources,
    traffic_role: overrides.traffic_role ?? 'INACTIVE',
    strategy: overrides.strategy ?? baseStrategy,
    urls: overrides.urls ?? {
      canonical_url: null,
      deployment_url: null
    },
    origin: overrides.origin ?? {
      type: 'console',
      source_environment_id: null,
      source_deployment_version_id: null,
      promoted_from: null
    },
    kivo: overrides.kivo ?? {
      metadata_object: null,
      deployment_version_object: null,
      revision_token: null
    },
    audit: {
      trigger: 'console',
      requested_by_user_id: '456',
      requested_by_email: 'rafael.umman@azion.com',
      requested_at: requestedAt,
      ready_at: readyAt,
      ...(overrides.audit ?? {})
    },
    state: overrides.state ?? 'ready',
    state_detail: overrides.state_detail ?? null,
    client_id: overrides.client_id ?? '1234567',
    last_modified_by: overrides.last_modified_by ?? {
      user_id: '456',
      trigger: 'console',
      email: 'rafael.umman@azion.com'
    },
    created_at: overrides.created_at ?? requestedAt
  }
}

export const deploymentHistoryMock = [
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VC',
    name: 'release-checkout-redesign',
    traffic_role: 'ACTIVE',
    state: 'building',
    requested_at: isoFromBase(0),
    ready_at: null,
    created_at: isoFromBase(0),
    urls: {
      canonical_url: 'https://checkout.azion.app',
      deployment_url: 'https://checkout-redesign.azion.app'
    }
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VD',
    name: 'release-payments-gateway',
    traffic_role: 'ACTIVE',
    state: 'ready',
    requested_at: isoFromBase(1, 2),
    ready_at: isoFromBase(1, 0),
    created_at: isoFromBase(1, 2),
    urls: {
      canonical_url: 'https://payments.azion.app',
      deployment_url: 'https://payments-gateway.azion.app'
    }
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VE',
    name: 'feature-cart-promotions',
    traffic_role: 'CANDIDATE',
    state: 'building',
    requested_at: isoFromBase(2),
    ready_at: null,
    created_at: isoFromBase(2),
    audit: {
      trigger: 'cli',
      requested_by_user_id: '789',
      requested_by_email: 'lucas.martins@azion.com'
    }
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VF',
    name: 'hotfix-auth-session-expiry',
    traffic_role: 'VALID_URL',
    state: 'error',
    state_detail: 'Catalog validation failed: function not found',
    requested_at: isoFromBase(3, 1),
    ready_at: null,
    created_at: isoFromBase(3, 1),
    audit: {
      trigger: 'terraform',
      requested_by_user_id: '321',
      requested_by_email: 'sophia.hernandez@azion.com'
    }
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VG',
    name: 'feature-search-suggestions',
    traffic_role: 'VALID_URL',
    state: 'queued',
    requested_at: isoFromBase(4),
    ready_at: null,
    created_at: isoFromBase(4)
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VH',
    name: 'experiment-homepage-banner',
    traffic_role: 'INACTIVE',
    state: 'draft',
    requested_at: isoFromBase(5),
    ready_at: null,
    created_at: isoFromBase(5),
    audit: {
      trigger: 'console',
      requested_by_user_id: '654',
      requested_by_email: 'ethan.jones@azion.com'
    },
    resources: [
      {
        resource_type: 'application',
        resource_id: '01HRX900APP000000000000099',
        resource_version_id: 'v0.2.0',
        resource_name: 'homepage-experiment'
      },
      {
        resource_type: 'custom_page',
        resource_id: '01HRX900CPG000000000000099',
        resource_version_id: 'v0.1.0',
        resource_name: 'banner-variant-b'
      }
    ]
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VJ',
    name: 'rollback-shipping-rates',
    traffic_role: 'INACTIVE',
    state: 'canceled',
    requested_at: isoFromBase(6),
    ready_at: null,
    created_at: isoFromBase(6),
    audit: {
      trigger: 'console',
      requested_by_user_id: '987',
      requested_by_email: 'amira.khan@azion.com'
    }
  }),
  buildVersion({
    id: '01HRX92PS4N7D3M2Y8T6Q1K5VK',
    name: 'release-observability-stack',
    deployment_id: '01HRX8W6S3M9A4K7P2Q5T8Z1YC',
    traffic_role: 'ACTIVE',
    state: 'ready',
    requested_at: isoFromBase(7, 5),
    ready_at: isoFromBase(7, 3, 21),
    created_at: isoFromBase(7, 5),
    urls: {
      canonical_url: 'https://observability.azion.app',
      deployment_url: 'https://observability-stack.azion.app'
    }
  })
]

export const deploymentHistoryMockResponse = {
  results: deploymentHistoryMock,
  count: deploymentHistoryMock.length
}
