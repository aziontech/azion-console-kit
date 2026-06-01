// TODO: replace with real service when the deployments-per-workload endpoint is ready.

export const STATUS_TAG = {
  ready: { content: 'Ready', severity: 'success' },
  building: { content: 'Building', severity: 'secondary' },
  error: { content: 'Error', severity: 'danger' },
  queued: { content: 'Queued', severity: 'warning' }
}

const ENVIRONMENT_META = {
  Production: { label: 'Production', icon: 'pi pi-globe' },
  Stage: { label: 'Stage', icon: 'pi pi-bolt' }
}

const resourceSet = (variant) => {
  const variants = {
    variantA: [
      {
        id: 'app-1',
        type: 'application',
        label: 'Application',
        icon: 'ai ai-edge-application',
        name: 'commerce-app',
        versionId: 'v3'
      },
      {
        id: 'fw-1',
        type: 'firewall',
        label: 'Firewall',
        icon: 'ai ai-edge-firewall',
        name: 'edge-firewall',
        versionId: 'v2'
      },
      {
        id: 'waf-1',
        type: 'waf',
        label: 'WAF Rule',
        icon: 'ai ai-waf-rules',
        name: 'waf_strict',
        versionId: 'v1'
      },
      {
        id: 'ds-1',
        type: 'data_stream',
        label: 'Data Stream',
        icon: 'ai ai-data-stream',
        name: 'analytics-stream',
        versionId: 'v4'
      },
      {
        id: 'cp-1',
        type: 'custom_page',
        label: 'Custom Page',
        icon: 'ai ai-custom-pages',
        name: 'maintenance-page',
        versionId: 'v1'
      }
    ],
    variantB: [
      {
        id: 'app-2',
        type: 'application',
        label: 'Application',
        icon: 'ai ai-edge-application',
        name: 'checkout-app',
        versionId: 'v7'
      },
      {
        id: 'fw-2',
        type: 'firewall',
        label: 'Firewall',
        icon: 'ai ai-edge-firewall',
        name: 'checkout-firewall',
        versionId: 'v3'
      },
      {
        id: 'waf-2',
        type: 'waf',
        label: 'WAF Rule',
        icon: 'ai ai-waf-rules',
        name: 'waf_relaxed',
        versionId: 'v2'
      },
      {
        id: 'ds-2',
        type: 'data_stream',
        label: 'Data Stream',
        icon: 'ai ai-data-stream',
        name: 'audit-stream',
        versionId: 'v1'
      },
      {
        id: 'cp-2',
        type: 'custom_page',
        label: 'Custom Page',
        icon: 'ai ai-custom-pages',
        name: 'error-page',
        versionId: 'v2'
      }
    ],
    variantC: [
      {
        id: 'app-3',
        type: 'application',
        label: 'Application',
        icon: 'ai ai-edge-application',
        name: 'static-site-app',
        versionId: 'v12'
      },
      {
        id: 'fw-3',
        type: 'firewall',
        label: 'Firewall',
        icon: 'ai ai-edge-firewall',
        name: 'static-firewall',
        versionId: 'v4'
      },
      {
        id: 'waf-3',
        type: 'waf',
        label: 'WAF Rule',
        icon: 'ai ai-waf-rules',
        name: 'waf_default',
        versionId: 'v3'
      },
      {
        id: 'ds-3',
        type: 'data_stream',
        label: 'Data Stream',
        icon: 'ai ai-data-stream',
        name: 'access-logs-stream',
        versionId: 'v2'
      },
      {
        id: 'cp-3',
        type: 'custom_page',
        label: 'Custom Page',
        icon: 'ai ai-custom-pages',
        name: 'not-found-page',
        versionId: 'v1'
      }
    ]
  }
  return variants[variant]
}

const baseUrls = (slug) => ({
  deployment_url: `https://${slug}.azion.com`,
  canonical_url: `https://${slug}.map.azionedge.net`
})

const enrich = ({ environment, author, createdAt, resourceVariant, urlSlug }) => {
  const meta = ENVIRONMENT_META[environment] ?? { label: environment, icon: 'pi pi-box' }
  return {
    environmentLabel: meta.label,
    environmentIcon: meta.icon,
    lastEditor: author,
    created_at: createdAt,
    urls: baseUrls(urlSlug),
    resources: resourceSet(resourceVariant)
  }
}

export const MOCK_DEPLOYMENTS = [
  {
    id: 'd-1',
    deploymentId: '129318321',
    environment: 'Production',
    status: 'building',
    duration: null,
    isCurrent: true,
    isRollback: false,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Production',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantA',
      urlSlug: 'commerce-prod'
    })
  },
  {
    id: 'd-2',
    deploymentId: '129318321',
    environment: 'Production',
    status: 'ready',
    duration: '99s',
    isCurrent: false,
    isRollback: false,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Production',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantB',
      urlSlug: 'commerce-prod-v2'
    })
  },
  {
    id: 'd-3',
    deploymentId: '129318321',
    environment: 'Production',
    status: 'building',
    duration: null,
    isCurrent: false,
    isRollback: false,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Production',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantA',
      urlSlug: 'commerce-prod-v3'
    })
  },
  {
    id: 'd-4',
    deploymentId: '129318321',
    environment: 'Stage',
    status: 'error',
    duration: null,
    isCurrent: false,
    isRollback: true,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Stage',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantC',
      urlSlug: 'commerce-stage'
    })
  },
  {
    id: 'd-5',
    deploymentId: '129318321',
    environment: 'Stage',
    status: 'queued',
    duration: null,
    isCurrent: false,
    isRollback: true,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Stage',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantB',
      urlSlug: 'commerce-stage-v2'
    })
  },
  {
    id: 'd-6',
    deploymentId: '129318321',
    environment: 'Production',
    status: 'ready',
    duration: '99s',
    isCurrent: false,
    isRollback: false,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Production',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantA',
      urlSlug: 'commerce-prod-stable'
    })
  },
  {
    id: 'd-7',
    deploymentId: '129318321',
    environment: 'Production',
    status: 'building',
    duration: null,
    isCurrent: false,
    isRollback: false,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Production',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantC',
      urlSlug: 'commerce-prod-canary'
    })
  },
  {
    id: 'd-8',
    deploymentId: '129318321',
    environment: 'Stage',
    status: 'error',
    duration: null,
    isCurrent: false,
    isRollback: true,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Stage',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantB',
      urlSlug: 'commerce-stage-hotfix'
    })
  },
  {
    id: 'd-9',
    deploymentId: '129318321',
    environment: 'Stage',
    status: 'queued',
    duration: null,
    isCurrent: false,
    isRollback: true,
    createdAt: '2026-05-15T11:00:25Z',
    author: 'rafael.umman@azion.com',
    ...enrich({
      environment: 'Stage',
      author: 'rafael.umman@azion.com',
      createdAt: '2026-05-15T11:00:25Z',
      resourceVariant: 'variantA',
      urlSlug: 'commerce-stage-rc'
    })
  }
]

export const findWorkloadDeploymentById = (id) =>
  MOCK_DEPLOYMENTS.find((item) => item.id === id) ?? null

export const statusTag = (status) =>
  STATUS_TAG[status] ?? { content: status || 'Unknown', severity: 'secondary' }
