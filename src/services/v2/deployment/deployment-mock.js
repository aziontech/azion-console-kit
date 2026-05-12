// src/services/v2/deployment/deployment-mock.js

import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'
import { queryClient } from '@/services/v2/base/query/queryClient'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

// Helper to format status for display
const formatStatus = (status) => {
  const statusMap = {
    ready: { content: 'Ready', severity: 'success' },
    building: { content: 'Building', severity: 'contrast' },
    draft: { content: 'Draft', severity: 'info' },
    error: { content: 'Error', severity: 'danger' },
    canceled: { content: 'Canceled', severity: 'warn' }
  }
  return statusMap[status] || { content: status, severity: 'secondary' }
}

// Helper to get current timestamp
const getCurrentTimestamp = () => {
  return new Date().toISOString()
}

const kindToQueryKey = {
  workload: queryKeys.workload.all,
  application: queryKeys.application.all,
  firewall: queryKeys.firewall.all,
  variable: queryKeys.variables.all,
  connector: queryKeys.edgeConnectors.all,
  edgeDns: queryKeys.edgeDNS.all,
  edgeNode: queryKeys.edgeNode.all,
  dataStream: queryKeys.dataStream.all,
  digitalCertificate: queryKeys.digitalCertificates.all,
  customPage: queryKeys.customPages.all,
  edgeService: queryKeys.edgeService.all,
  function: queryKeys.edgeFunction.all,
  networkList: queryKeys.networkLists.all,
  wafRule: queryKeys.waf.all,
  objectStorage: queryKeys.edgeStorage.buckets.all(),
  sqlDatabase: queryKeys.edgeSql.all
}

const textKeys = ['text', 'content', 'value', 'label', 'name', 'key']

const resolvePrimitiveText = (value) => {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    for (const key of textKeys) {
      const candidate = value[key]
      if (typeof candidate === 'string' || typeof candidate === 'number') {
        return String(candidate)
      }
    }
  }
  return ''
}

const extractListItems = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.body)) return data.body
  if (Array.isArray(data?.data)) return data.data
  if (Array.isArray(data?.results)) return data.results
  return []
}

const pickFirstFromCache = (kind) => {
  const queryKey = kindToQueryKey[kind]
  if (!queryKey) return null

  try {
    const entries = queryClient.getQueriesData({ queryKey })
    for (const [, data] of entries) {
      const items = extractListItems(data)
      if (items.length === 0) continue

      const first = items[0]
      const name = resolvePrimitiveText(first?.name) || resolvePrimitiveText(first?.key)
      if (!name) continue

      return { name, hash: 'latest' }
    }
  } catch {
    return null
  }

  return null
}

const hydrateResourcePack = (resourcePack) => {
  if (!resourcePack || typeof resourcePack !== 'object') return resourcePack

  const hydrated = {}
  for (const [kind, entry] of Object.entries(resourcePack)) {
    const fromCache = pickFirstFromCache(kind)
    hydrated[kind] = fromCache || entry
  }
  return hydrated
}

const hydrateDeployment = (deployment) =>
  deployment
    ? { ...deployment, resourcePack: hydrateResourcePack(deployment.resourcePack) }
    : deployment

let deployments = [
  {
    id: '1',
    name: 'Production Release v2.4.0',
    hash: 'a1b2c3d4',
    environment: 'production',
    isCurrent: true,
    status: formatStatus('ready'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'v2.4.0' },
      firewall: { name: 'Azion Global Firewall', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '2',
    name: 'Staging Hotfix - Auth Flow',
    hash: 'e5f6g7h8',
    environment: 'staging',
    isCurrent: false,
    status: formatStatus('building'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'latest' },
      firewall: { name: 'Managed WAF', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '3',
    name: 'Dev Sandbox Build',
    hash: 'i9j0k1l2',
    environment: 'development',
    isCurrent: false,
    status: formatStatus('draft'),
    resourcePack: {
      application: { name: 'Dev Console kit', hash: 'latest' },
      firewall: { name: 'Development Firewall', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '4',
    name: 'Production Release v2.3.9',
    hash: 'm3n4o5p6',
    environment: 'production',
    isCurrent: false,
    status: formatStatus('error'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'v2.3.9' },
      firewall: { name: 'Azion Global Firewall', hash: 'latest' },
      customPage: { name: 'Global error page', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '5',
    name: 'Canary Experiment',
    hash: 'q7r8s9t0',
    environment: 'staging',
    isCurrent: false,
    status: formatStatus('canceled'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'latest' },
      firewall: { name: 'Azion Global Firewall', hash: 'latest' },
      wafRule: { name: 'Managed WAF', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '6',
    name: 'Production Release v2.4.0',
    hash: 'i9j0k1l2',
    environment: 'production',
    isCurrent: true,
    status: formatStatus('ready'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'v2.4.0' },
      firewall: { name: 'Azion Global Firewall', hash: 'latest' },
      customPage: { name: 'Global error page', hash: 'latest' },
      wafRule: { name: 'Managed WAF', hash: 'latest' }
    },
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  }
]

const simulateDelay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const findDeploymentIndexOrThrow = (id) => {
  const index = deployments.findIndex((dep) => dep.id === id)
  if (index === -1) {
    throw new Error('Deployment not found')
  }

  return index
}

const updateDeploymentTimestamp = (deployment) => ({
  ...deployment,
  lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
})

export const listDeploymentsService = async () => {
  await simulateDelay()
  // Return deployments sorted by most recent first (reverse order)
  return {
    data: [...deployments].reverse().map(hydrateDeployment),
    total: deployments.length
  }
}

export const cancelDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)

  if (deployments[index].status?.content !== 'Building') {
    throw new Error('Only building deployments can be canceled')
  }

  deployments[index] = {
    ...updateDeploymentTimestamp(deployments[index]),
    status: formatStatus('canceled')
  }

  return { data: deployments[index] }
}

export const cloneDeploymentToDraftService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)

  if (deployments[index].status?.content !== 'Ready') {
    throw new Error('Only ready deployments can be cloned to draft')
  }

  const clonedDeployment = {
    ...deployments[index],
    id: String(Date.now()),
    hash: `${deployments[index].hash}-draft`,
    isCurrent: false,
    status: formatStatus('draft')
  }

  deployments = [updateDeploymentTimestamp(clonedDeployment), ...deployments]

  return { data: hydrateDeployment(deployments[0]) }
}

export const buildDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)

  if (deployments[index].status?.content !== 'Draft') {
    throw new Error('Only draft deployments can be built')
  }

  deployments[index] = {
    ...updateDeploymentTimestamp(deployments[index]),
    status: formatStatus('building')
  }

  return { data: deployments[index] }
}

export const deleteDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)

  if (deployments[index].status?.content !== 'Draft') {
    throw new Error('Only draft deployments can be deleted')
  }

  const [deletedDeployment] = deployments.splice(index, 1)

  return { data: deletedDeployment }
}

export const reopenDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)

  const currentStatus = deployments[index].status?.content
  if (currentStatus !== 'Error' && currentStatus !== 'Canceled') {
    throw new Error('Only errored or canceled deployments can be reopened')
  }

  deployments[index] = {
    ...updateDeploymentTimestamp(deployments[index]),
    status: formatStatus('draft')
  }

  return { data: deployments[index] }
}

export const rollbackDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)
  const selected = deployments[index]

  if (selected.status?.content !== 'Ready' || !selected.isCurrent) {
    throw new Error('Only current ready deployments can be rolled back')
  }

  const previousReady = deployments.find(
    (deployment) =>
      deployment.id !== selected.id &&
      deployment.environment === selected.environment &&
      deployment.status?.content === 'Ready' &&
      !deployment.isCurrent
  )

  if (!previousReady) {
    throw new Error('No previous ready deployment available for rollback')
  }

  deployments = deployments.map((deployment) => {
    if (deployment.id === selected.id) {
      return updateDeploymentTimestamp({
        ...deployment,
        isCurrent: false
      })
    }

    if (deployment.id === previousReady.id) {
      return updateDeploymentTimestamp({
        ...deployment,
        isCurrent: true
      })
    }

    return deployment
  })

  return { data: deployments.find((deployment) => deployment.id === previousReady.id) }
}

// Generic placeholder version list — there is no real API for
// "list versions of a resource" today. Swap when the endpoint exists.
const PLACEHOLDER_VERSIONS = ['latest', 'v2.4.0', 'v2.3.9', 'v2.3.8']

// eslint-disable-next-line no-unused-vars
export const listResourceVersionsService = async (_type, _resourceIdentifier) => {
  await simulateDelay(150)
  return {
    data: PLACEHOLDER_VERSIONS.map((version) => ({ value: version, label: version }))
  }
}

export const getDeploymentByIdService = async (id) => {
  await simulateDelay()
  const deployment = deployments.find((dep) => dep.id === String(id))

  if (!deployment) {
    throw new Error('Deployment not found')
  }

  return { data: hydrateDeployment(deployment) }
}

const generateHash = () => Math.random().toString(36).slice(2, 10)

export const createDeploymentService = async (payload) => {
  await simulateDelay()

  const newDeployment = {
    id: String(Date.now()),
    name: payload?.name?.trim() || 'Untitled deployment',
    hash: generateHash(),
    environment: payload?.environment || 'development',
    isCurrent: false,
    status: formatStatus(payload?.buildOnCreate ? 'building' : 'draft'),
    resourcePack: payload?.resourcePack || {},
    publishDomain: payload?.publishDomain || '',
    description: payload?.description || '',
    deploymentPolicy: payload?.deploymentPolicy || 'manual-approve',
    deploymentStrategy: payload?.deploymentStrategy || 'all-at-once',
    gradualDeploymentEnabled: Boolean(payload?.gradualDeploymentEnabled),
    gradualVersion: payload?.gradualVersion || '',
    trafficPercentage: Number(payload?.trafficPercentage ?? 10),
    skewProtectionEnabled: Boolean(payload?.skewProtectionEnabled),
    lastEditor: 'guilherme.santana@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  }

  deployments = [newDeployment, ...deployments]

  return {
    data: hydrateDeployment(newDeployment),
    feedback: payload?.buildOnCreate
      ? 'Deployment version build started'
      : 'Deployment version saved as draft'
  }
}

export const updateDeploymentService = async (id, payload) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(String(id))

  if (deployments[index].status?.content !== 'Draft') {
    throw new Error('Only draft deployments can be edited')
  }

  deployments[index] = updateDeploymentTimestamp({
    ...deployments[index],
    name: payload?.name?.trim() || deployments[index].name,
    description: payload?.description ?? deployments[index].description ?? '',
    environment: payload?.environment ?? deployments[index].environment,
    publishDomain: payload?.publishDomain ?? deployments[index].publishDomain ?? '',
    deploymentPolicy: payload?.deploymentPolicy ?? deployments[index].deploymentPolicy,
    deploymentStrategy: payload?.deploymentStrategy ?? deployments[index].deploymentStrategy,
    gradualDeploymentEnabled: Boolean(payload?.gradualDeploymentEnabled),
    gradualVersion: payload?.gradualVersion ?? deployments[index].gradualVersion ?? '',
    trafficPercentage: Number(
      payload?.trafficPercentage ?? deployments[index].trafficPercentage ?? 10
    ),
    skewProtectionEnabled: Boolean(payload?.skewProtectionEnabled),
    resourcePack: payload?.resourcePack ?? deployments[index].resourcePack ?? {}
  })

  return {
    data: deployments[index],
    feedback: 'Deployment version updated'
  }
}

export const promoteDeploymentService = async (id) => {
  await simulateDelay()
  const index = findDeploymentIndexOrThrow(id)
  const selected = deployments[index]

  if (selected.status?.content !== 'Ready' || selected.isCurrent) {
    throw new Error('Only non-current ready deployments can be promoted')
  }

  deployments = deployments.map((deployment) => {
    if (deployment.environment !== selected.environment) {
      return deployment
    }

    return updateDeploymentTimestamp({
      ...deployment,
      isCurrent: deployment.id === selected.id
    })
  })

  return { data: deployments.find((deployment) => deployment.id === selected.id) }
}
