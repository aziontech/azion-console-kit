// Mock layer for Deployment-scoped versions.
// TODO: replace with the real `v4/.../deployments/:id/versions` endpoint once finalized.
//
// All timestamps below are deterministic, hardcoded ISO strings on purpose.
// Do NOT read the runtime clock or use any random generator in the seed data:
// the mock must be stable across runs so snapshots and screenshots stay diff-free.

import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'

const simulateDelay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

// RAW seed versions (pre-adapter). These mirror the fields the real API returns
// and that DeploymentVersionAdapter.normalizeVersion expects:
// id, deployment_id, name, resources[{resource_type, resource_id, resource_name}],
// traffic_role, strategy, urls, origin, audit{requested_at, ready_at, requested_by_email},
// state, created_at.
const RAW_VERSIONS = [
  {
    id: 'dv-001',
    deployment_id: '101',
    name: 'release-checkout-redesign',
    traffic_role: 'ACTIVE',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-9001',
        resource_name: 'checkout-edge-app'
      },
      {
        resource_type: 'firewall',
        resource_id: 'fw-3001',
        resource_name: 'Azion Global Firewall'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://checkout.azion.com',
      deployment_url: 'https://dv-001.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'guilherme.santana@azion.com',
      requested_at: '2026-05-30T17:04:00.000Z',
      ready_at: '2026-05-30T17:06:42.000Z'
    },
    created_at: '2026-05-30T17:04:00.000Z'
  },
  {
    id: 'dv-002',
    deployment_id: '101',
    name: 'feature-cart-promotions',
    traffic_role: 'CANDIDATE',
    state: 'building',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-9001',
        resource_name: 'checkout-edge-app'
      },
      {
        resource_type: 'function',
        resource_id: 'fn-5501',
        resource_name: 'promo-discount-fn'
      }
    ],
    strategy: {
      rollout_mode: 'gradual',
      gradual_rollout: { enabled: true, candidate_percentage: 15 }
    },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-002.map.azionedge.net'
    },
    origin: { type: 'promotion', source_deployment_version_id: 'dv-001' },
    audit: {
      trigger: 'pipeline',
      requested_by_email: 'maria.silva@azion.com',
      requested_at: '2026-05-29T11:22:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-29T11:22:00.000Z'
  },
  {
    id: 'dv-003',
    deployment_id: '101',
    name: 'hotfix-auth-session-expiry',
    traffic_role: 'VALID_URL',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-9001',
        resource_name: 'checkout-edge-app'
      },
      {
        resource_type: 'custom_page',
        resource_id: 'cp-2201',
        resource_name: 'Global error page'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://dv-003.map.azionedge.net',
      deployment_url: 'https://dv-003.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'lukas.barros@azion.com',
      requested_at: '2026-05-27T09:17:00.000Z',
      ready_at: '2026-05-27T09:18:35.000Z'
    },
    created_at: '2026-05-27T09:17:00.000Z'
  },
  {
    id: 'dv-004',
    deployment_id: '101',
    name: 'feature-cart-promotions-rollback',
    traffic_role: 'INACTIVE',
    state: 'canceled',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-9001',
        resource_name: 'checkout-edge-app'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-004.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'renata.cardoso@azion.com',
      requested_at: '2026-05-25T14:40:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-25T14:40:00.000Z'
  },
  {
    id: 'dv-005',
    deployment_id: '202',
    name: 'release-storefront-search',
    traffic_role: 'ACTIVE',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-7702',
        resource_name: 'storefront-edge-app'
      },
      {
        resource_type: 'function',
        resource_id: 'fn-6602',
        resource_name: 'search-rank-fn'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://store.azion.com',
      deployment_url: 'https://dv-005.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'joaquim.tavares@azion.com',
      requested_at: '2026-05-28T16:55:00.000Z',
      ready_at: '2026-05-28T16:58:12.000Z'
    },
    created_at: '2026-05-28T16:55:00.000Z'
  },
  {
    id: 'dv-006',
    deployment_id: '202',
    name: 'feature-storefront-recommendations',
    traffic_role: 'CANDIDATE',
    state: 'queued',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-7702',
        resource_name: 'storefront-edge-app'
      }
    ],
    strategy: {
      rollout_mode: 'gradual',
      gradual_rollout: { enabled: true, candidate_percentage: 25 }
    },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-006.map.azionedge.net'
    },
    origin: { type: 'promotion', source_deployment_version_id: 'dv-005' },
    audit: {
      trigger: 'pipeline',
      requested_by_email: 'maria.silva@azion.com',
      requested_at: '2026-05-26T10:42:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-26T10:42:00.000Z'
  },
  {
    id: 'dv-007',
    deployment_id: '202',
    name: 'hotfix-storefront-cache-headers',
    traffic_role: 'VALID_URL',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-7702',
        resource_name: 'storefront-edge-app'
      },
      {
        resource_type: 'firewall',
        resource_id: 'fw-3002',
        resource_name: 'Azion Global Firewall'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://dv-007.map.azionedge.net',
      deployment_url: 'https://dv-007.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'lukas.barros@azion.com',
      requested_at: '2026-05-22T09:01:00.000Z',
      ready_at: '2026-05-22T09:02:08.000Z'
    },
    created_at: '2026-05-22T09:01:00.000Z'
  },
  {
    id: 'dv-008',
    deployment_id: '202',
    name: 'draft-storefront-experiments',
    traffic_role: 'INACTIVE',
    state: 'draft',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-7702',
        resource_name: 'storefront-edge-app'
      }
    ],
    strategy: { rollout_mode: null },
    urls: {
      canonical_url: null,
      deployment_url: null
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'guilherme.santana@azion.com',
      requested_at: '2026-05-20T15:10:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-20T15:10:00.000Z'
  },
  {
    id: 'dv-009',
    deployment_id: '303',
    name: 'release-auth-mfa',
    traffic_role: 'ACTIVE',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-8803',
        resource_name: 'auth-edge-app'
      },
      {
        resource_type: 'firewall',
        resource_id: 'fw-3003',
        resource_name: 'Azion Global Firewall'
      },
      {
        resource_type: 'function',
        resource_id: 'fn-7703',
        resource_name: 'mfa-challenge-fn'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://auth.azion.com',
      deployment_url: 'https://dv-009.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'renata.cardoso@azion.com',
      requested_at: '2026-05-24T13:33:00.000Z',
      ready_at: '2026-05-24T13:36:50.000Z'
    },
    created_at: '2026-05-24T13:33:00.000Z'
  },
  {
    id: 'dv-010',
    deployment_id: '303',
    name: 'hotfix-auth-session-expiry',
    traffic_role: 'CANDIDATE',
    state: 'error',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-8803',
        resource_name: 'auth-edge-app'
      }
    ],
    strategy: {
      rollout_mode: 'gradual',
      gradual_rollout: { enabled: true, candidate_percentage: 10 }
    },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-010.map.azionedge.net'
    },
    origin: { type: 'promotion', source_deployment_version_id: 'dv-009' },
    audit: {
      trigger: 'pipeline',
      requested_by_email: 'joaquim.tavares@azion.com',
      requested_at: '2026-05-21T08:48:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-21T08:48:00.000Z'
  },
  {
    id: 'dv-011',
    deployment_id: '303',
    name: 'feature-auth-social-login',
    traffic_role: 'VALID_URL',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-8803',
        resource_name: 'auth-edge-app'
      },
      {
        resource_type: 'custom_page',
        resource_id: 'cp-2203',
        resource_name: 'Login error page'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://dv-011.map.azionedge.net',
      deployment_url: 'https://dv-011.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'maria.silva@azion.com',
      requested_at: '2026-05-18T11:05:00.000Z',
      ready_at: '2026-05-18T11:07:19.000Z'
    },
    created_at: '2026-05-18T11:05:00.000Z'
  },
  {
    id: 'dv-012',
    deployment_id: '303',
    name: 'draft-auth-passkeys',
    traffic_role: 'INACTIVE',
    state: 'draft',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-8803',
        resource_name: 'auth-edge-app'
      }
    ],
    strategy: { rollout_mode: null },
    urls: {
      canonical_url: null,
      deployment_url: null
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'lukas.barros@azion.com',
      requested_at: '2026-05-15T16:20:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-15T16:20:00.000Z'
  },
  {
    id: 'dv-013',
    deployment_id: '404',
    name: 'release-payments-gateway',
    traffic_role: 'ACTIVE',
    state: 'ready',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-6604',
        resource_name: 'payments-edge-app'
      },
      {
        resource_type: 'firewall',
        resource_id: 'fw-3004',
        resource_name: 'Azion Global Firewall'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: 'https://payments.azion.com',
      deployment_url: 'https://dv-013.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'guilherme.santana@azion.com',
      requested_at: '2026-05-23T18:12:00.000Z',
      ready_at: '2026-05-23T18:15:27.000Z'
    },
    created_at: '2026-05-23T18:12:00.000Z'
  },
  {
    id: 'dv-014',
    deployment_id: '404',
    name: 'feature-payments-pix',
    traffic_role: 'CANDIDATE',
    state: 'building',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-6604',
        resource_name: 'payments-edge-app'
      },
      {
        resource_type: 'function',
        resource_id: 'fn-8804',
        resource_name: 'pix-charge-fn'
      }
    ],
    strategy: {
      rollout_mode: 'gradual',
      gradual_rollout: { enabled: true, candidate_percentage: 30 }
    },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-014.map.azionedge.net'
    },
    origin: { type: 'promotion', source_deployment_version_id: 'dv-013' },
    audit: {
      trigger: 'pipeline',
      requested_by_email: 'renata.cardoso@azion.com',
      requested_at: '2026-05-19T10:30:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-19T10:30:00.000Z'
  },
  {
    id: 'dv-015',
    deployment_id: '404',
    name: 'hotfix-payments-timeout',
    traffic_role: 'VALID_URL',
    state: 'queued',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-6604',
        resource_name: 'payments-edge-app'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-015.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'joaquim.tavares@azion.com',
      requested_at: '2026-05-16T09:55:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-16T09:55:00.000Z'
  },
  {
    id: 'dv-016',
    deployment_id: '404',
    name: 'release-payments-gateway-superseded',
    traffic_role: 'INACTIVE',
    state: 'canceled',
    resources: [
      {
        resource_type: 'application',
        resource_id: 'app-6604',
        resource_name: 'payments-edge-app'
      }
    ],
    strategy: { rollout_mode: 'immediate' },
    urls: {
      canonical_url: null,
      deployment_url: 'https://dv-016.map.azionedge.net'
    },
    origin: { type: 'manual' },
    audit: {
      trigger: 'manual',
      requested_by_email: 'maria.silva@azion.com',
      requested_at: '2026-05-12T14:08:00.000Z',
      ready_at: null
    },
    created_at: '2026-05-12T14:08:00.000Z'
  }
]

// Deterministic fallback seeds keyed off an arbitrary deploymentId, so any
// deployment surfaces some versions during the mock phase even when there is no
// explicit RAW_VERSIONS match. Timestamps remain fixed literal ISO strings.
const buildFallbackSeed = (deploymentId) => {
  const id = String(deploymentId ?? 'default')
  return [
    {
      id: `${id}-fallback-1`,
      deployment_id: id,
      name: 'release-checkout-redesign',
      traffic_role: 'ACTIVE',
      state: 'ready',
      resources: [
        {
          resource_type: 'application',
          resource_id: `${id}-app-1`,
          resource_name: 'application 001'
        },
        {
          resource_type: 'firewall',
          resource_id: `${id}-fw-1`,
          resource_name: 'Azion Global Firewall'
        }
      ],
      strategy: { rollout_mode: 'immediate' },
      urls: {
        canonical_url: `https://dep-${id}.azion.com`,
        deployment_url: `https://${id}-fallback-1.map.azionedge.net`
      },
      origin: { type: 'manual' },
      audit: {
        trigger: 'manual',
        requested_by_email: 'guilherme.santana@azion.com',
        requested_at: '2026-05-30T17:04:00.000Z',
        ready_at: '2026-05-30T17:06:42.000Z'
      },
      created_at: '2026-05-30T17:04:00.000Z'
    },
    {
      id: `${id}-fallback-2`,
      deployment_id: id,
      name: 'feature-cart-promotions',
      traffic_role: 'CANDIDATE',
      state: 'building',
      resources: [
        {
          resource_type: 'application',
          resource_id: `${id}-app-1`,
          resource_name: 'application 002'
        }
      ],
      strategy: {
        rollout_mode: 'gradual',
        gradual_rollout: { enabled: true, candidate_percentage: 20 }
      },
      urls: {
        canonical_url: null,
        deployment_url: `https://${id}-fallback-2.map.azionedge.net`
      },
      origin: { type: 'promotion', source_deployment_version_id: `${id}-fallback-1` },
      audit: {
        trigger: 'pipeline',
        requested_by_email: 'maria.silva@azion.com',
        requested_at: '2026-05-29T11:22:00.000Z',
        ready_at: null
      },
      created_at: '2026-05-29T11:22:00.000Z'
    },
    {
      id: `${id}-fallback-3`,
      deployment_id: id,
      name: 'hotfix-auth-session-expiry',
      traffic_role: 'VALID_URL',
      state: 'ready',
      resources: [
        {
          resource_type: 'application',
          resource_id: `${id}-app-1`,
          resource_name: 'application 003'
        },
        {
          resource_type: 'custom_page',
          resource_id: `${id}-cp-1`,
          resource_name: 'Global error page'
        }
      ],
      strategy: { rollout_mode: 'immediate' },
      urls: {
        canonical_url: `https://${id}-fallback-3.map.azionedge.net`,
        deployment_url: `https://${id}-fallback-3.map.azionedge.net`
      },
      origin: { type: 'manual' },
      audit: {
        trigger: 'manual',
        requested_by_email: 'lukas.barros@azion.com',
        requested_at: '2026-05-27T09:17:00.000Z',
        ready_at: '2026-05-27T09:18:35.000Z'
      },
      created_at: '2026-05-27T09:17:00.000Z'
    },
    {
      id: `${id}-fallback-4`,
      deployment_id: id,
      name: 'draft-experiments',
      traffic_role: 'INACTIVE',
      state: 'draft',
      resources: [
        {
          resource_type: 'application',
          resource_id: `${id}-app-1`,
          resource_name: 'application 004'
        }
      ],
      strategy: { rollout_mode: null },
      urls: {
        canonical_url: null,
        deployment_url: null
      },
      origin: { type: 'manual' },
      audit: {
        trigger: 'manual',
        requested_by_email: 'renata.cardoso@azion.com',
        requested_at: '2026-05-20T15:10:00.000Z',
        ready_at: null
      },
      created_at: '2026-05-20T15:10:00.000Z'
    }
  ]
}

const matchesSearch = (version, search) => {
  if (!search) return true
  const term = String(search).trim().toLowerCase()
  if (!term) return true
  return String(version.name ?? '')
    .toLowerCase()
    .includes(term)
}

const matchesState = (version, state) => {
  if (!state) return true
  return String(version.state ?? '').toLowerCase() === String(state).toLowerCase()
}

// `environment` is a derived, env-like pill mapped from traffic_role by the
// adapter. We filter against the transformed `environmentLabel` so the param
// matches what the UI shows (Production / Canary / Stage).
const matchesEnvironment = (version, environment) => {
  if (!environment) return true
  return String(version.environmentLabel ?? '').toLowerCase() === String(environment).toLowerCase()
}

const applyFilters = (versions, params = {}) => {
  return versions.filter(
    (version) =>
      matchesSearch(version, params.search) &&
      matchesState(version, params.state) &&
      matchesEnvironment(version, params.environment)
  )
}

const paginate = (versions, params = {}) => {
  const page = Number(params.page) > 0 ? Number(params.page) : 1
  const pageSize = Number(params.pageSize) > 0 ? Number(params.pageSize) : versions.length
  const start = (page - 1) * pageSize
  return versions.slice(start, start + pageSize)
}

export const listGlobalDeploymentVersionsMock = async (params = {}) => {
  await simulateDelay()
  const transformed = DeploymentVersionAdapter.transformList(RAW_VERSIONS)
  const filtered = applyFilters(transformed, params)
  return {
    body: paginate(filtered, params),
    count: filtered.length
  }
}

export const listDeploymentVersionsMock = async (deploymentId, params = {}) => {
  await simulateDelay()
  const key = String(deploymentId)
  const matchingRaw = RAW_VERSIONS.filter((version) => String(version.deployment_id) === key)
  const rawSeed = matchingRaw.length ? matchingRaw : buildFallbackSeed(key)
  const transformed = DeploymentVersionAdapter.transformList(rawSeed)
  const filtered = applyFilters(transformed, params)
  return {
    body: paginate(filtered, params),
    count: filtered.length
  }
}
