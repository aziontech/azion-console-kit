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
  const index = deployments.findIndex((dep) => dep.id === id)
  if (index === -1) {
    throw new Error('Deployment not found')
  }
  deployments[index] = {
    ...deployments[index],
    status: formatStatus('canceled'),
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  }
  return { data: deployments[index] }
}

export const redeployDeploymentService = async (id) => {
  await simulateDelay()
  const index = deployments.findIndex((dep) => dep.id === id)
  if (index === -1) {
    throw new Error('Deployment not found')
  }
  // Reset all isCurrent to false
  deployments = deployments.map((dep) => ({ ...dep, isCurrent: false }))
  // Set this deployment as current and status to ready
  deployments[index] = {
    ...deployments[index],
    isCurrent: true,
    status: { content: 'Ready', severity: 'info' },
    lastModified: formatDateToDayMonthYearHour(getCurrentTimestamp())
  }
  return { data: deployments[index] }
}
