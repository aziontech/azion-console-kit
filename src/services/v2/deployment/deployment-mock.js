// src/services/v2/deployment/deployment-mock.js

import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

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

let deployments = [
  {
    id: '1',
    hash: 'a1b2c3d4',
    environment: 'production',
    isCurrent: true,
    status: formatStatus('ready'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'qa1hsa' },
      firewall: { name: 'Azion Global Firewall', hash: 'k12wk' },
      workload: { name: 'Console Domain', hash: 'ad12la' }
    },
    lastEditor: 'user@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '2',
    hash: 'e5f6g7h8',
    environment: 'staging',
    isCurrent: false,
    status: formatStatus('building'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'bn3xpd' },
      firewall: { name: 'Managed WAF', hash: 'x82lm' },
      workload: { name: 'Staging Domain', hash: 'wz91ca' }
    },
    lastEditor: 'admin@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '3',
    hash: 'i9j0k1l2',
    environment: 'development',
    isCurrent: false,
    status: formatStatus('draft'),
    resourcePack: {
      application: { name: 'Dev Console kit', hash: 'dh2svl' },
      firewall: { name: 'Development Firewall', hash: 'fc45km' },
      workload: { name: 'Dev Domain', hash: 'nm21qy' }
    },
    lastEditor: 'dev@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '4',
    hash: 'm3n4o5p6',
    environment: 'production',
    isCurrent: false,
    status: formatStatus('error'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'qa1hsa' },
      firewall: { name: 'Azion Global Firewall', hash: 'k12wk' },
      workload: { name: 'Console Domain', hash: 'ad12la' }
    },
    lastEditor: 'user@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '5',
    hash: 'q7r8s9t0',
    environment: 'staging',
    isCurrent: false,
    status: formatStatus('canceled'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'tr82mn' },
      firewall: { name: 'Azion Global Firewall', hash: 'zb55qx' },
      workload: { name: 'Canary Domain', hash: 'pd39vr' }
    },
    lastEditor: 'admin@azion.com',
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  },
  {
    id: '6',
    hash: 'i9j0k1l2',
    environment: 'production',
    isCurrent: true,
    status: formatStatus('ready'),
    resourcePack: {
      application: { name: 'Console kit', hash: 'qa1hsa' },
      firewall: { name: 'Azion Global Firewall', hash: 'k12wk' },
      workload: { name: 'Console Domain', hash: 'ad12la' }
    },
    lastEditor: 'dev@azion.com',
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
    data: [...deployments].reverse(),
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

  return { data: deployments[0] }
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
