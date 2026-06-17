// Mock layer for Workload-scoped versions.
// TODO: replace with `v4/workspace/workloads/:id/deployments` once endpoint is finalized.

import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

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

const simulateDelay = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms))

const isoDaysAgo = (days, hour = 12, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

const buildSeed = (workloadId) => {
  const baseAuthors = [
    'guilherme.santana@azion.com',
    'maria.silva@azion.com',
    'lukas.barros@azion.com',
    'renata.cardoso@azion.com',
    'joaquim.tavares@azion.com'
  ]

  return [
    {
      id: `${workloadId}-v2.4.0`,
      tag: 'v2.4.0',
      name: 'Production Release v2.4.0',
      environment: 'production',
      isCurrent: true,
      status: formatStatus('ready'),
      note: 'Promote stable build after canary verification.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.2.1' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.4.0' },
        customPage: { name: 'Global error page', hash: 'v2.0.0' },
        digitalCertificate: { name: 'wildcard.azionedge.net', hash: '—' }
      },
      pipeline: 'pr-8842',
      commit: 'a3c9018e',
      branch: 'main',
      author: baseAuthors[0],
      createdAtISO: isoDaysAgo(1, 17, 4),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(1, 17, 4))
    },
    {
      id: `${workloadId}-v2.3.9`,
      tag: 'v2.3.9',
      name: 'Hotfix - Auth Flow',
      environment: 'production',
      isCurrent: false,
      status: formatStatus('ready'),
      note: 'Hotfix for auth flow regression.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.2.0' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.4.0' },
        customPage: { name: 'Global error page', hash: 'v1.9.4' }
      },
      author: baseAuthors[1],
      createdAtISO: isoDaysAgo(4, 11, 22),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(4, 11, 22))
    },
    {
      id: `${workloadId}-v2.3.8-canary`,
      tag: 'v2.3.8-canary',
      name: 'Canary build',
      environment: 'staging',
      isCurrent: false,
      status: formatStatus('canceled'),
      note: 'Replaced by v2.4.0 promotion.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.7' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.3.9' }
      },
      author: baseAuthors[2],
      createdAtISO: isoDaysAgo(6, 14, 40),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(6, 14, 40))
    },
    {
      id: `${workloadId}-v2.3.7`,
      tag: 'v2.3.7',
      name: 'Production Release v2.3.7',
      environment: 'production',
      isCurrent: false,
      status: formatStatus('error'),
      note: 'Build failed at certificate provisioning step.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.7' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.3.9' },
        digitalCertificate: { name: 'wildcard.azionedge.net', hash: 'expired' }
      },
      author: baseAuthors[3],
      createdAtISO: isoDaysAgo(8, 9, 17),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(8, 9, 17))
    },
    {
      id: `${workloadId}-v2.3.6`,
      tag: 'v2.3.6',
      name: 'Initial Versioning rollout',
      environment: 'production',
      isCurrent: false,
      status: formatStatus('ready'),
      note: 'Initial Workload Versioning rollout.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.5' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.3.9' }
      },
      author: baseAuthors[4],
      createdAtISO: isoDaysAgo(11, 16, 55),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(11, 16, 55))
    },
    {
      id: `${workloadId}-v2.3.5-draft`,
      tag: 'v2.3.5-draft',
      name: 'Draft - custom pages',
      environment: 'development',
      isCurrent: false,
      status: formatStatus('draft'),
      note: 'WIP — testing custom error pages.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.5' },
        customPage: { name: 'Global error page', hash: 'v1.9.0' }
      },
      author: baseAuthors[0],
      createdAtISO: isoDaysAgo(15, 15, 10),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(15, 15, 10))
    },
    {
      id: `${workloadId}-v2.3.4`,
      tag: 'v2.3.4',
      name: 'Firewall ruleset refresh',
      environment: 'production',
      isCurrent: false,
      status: formatStatus('ready'),
      note: 'Routine refresh of firewall ruleset.',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.4' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.3.8' },
        wafRule: { name: 'Managed WAF', hash: 'v3.2' }
      },
      author: baseAuthors[1],
      createdAtISO: isoDaysAgo(19, 10, 42),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(19, 10, 42))
    },
    {
      id: `${workloadId}-v2.3.3`,
      tag: 'v2.3.3',
      name: 'Production Release v2.3.3',
      environment: 'production',
      isCurrent: false,
      status: formatStatus('ready'),
      note: '',
      resourcePack: {
        application: { name: 'webkit-storybook', hash: 'v3.1.3' },
        firewall: { name: 'Azion Global Firewall', hash: 'v1.3.8' }
      },
      author: baseAuthors[2],
      createdAtISO: isoDaysAgo(24, 9, 1),
      createdAt: formatDateToDayMonthYearHour(isoDaysAgo(24, 9, 1))
    }
  ]
}

const versionsByWorkload = new Map()

const getVersions = (workloadId) => {
  const key = String(workloadId ?? 'default')
  if (!versionsByWorkload.has(key)) {
    versionsByWorkload.set(key, buildSeed(key))
  }
  return versionsByWorkload.get(key)
}

const sortByDateDesc = (versions) =>
  [...versions].sort(
    (left, right) => new Date(right.createdAtISO).valueOf() - new Date(left.createdAtISO).valueOf()
  )

export const listWorkloadVersionsService = async (workloadId) => {
  await simulateDelay()
  return { body: sortByDateDesc(getVersions(workloadId)) }
}

export const getCurrentWorkloadVersionService = async (workloadId) => {
  await simulateDelay(160)
  const versions = getVersions(workloadId)
  const current = versions.find((version) => version.isCurrent) || versions[0] || null
  return current ? { ...current } : null
}

const isWithinDays = (isoString, days) => {
  if (!isoString) return false
  const date = new Date(isoString).valueOf()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return date >= cutoff
}

export const getWorkloadVersionStatsService = async (workloadId) => {
  await simulateDelay(140)
  const versions = getVersions(workloadId)
  const live = versions.find((version) => version.isCurrent)
  const lastBuild = sortByDateDesc(versions)[0] || null
  const failedLast30 = versions.find(
    (version) => version.status?.content === 'Error' && isWithinDays(version.createdAtISO, 30)
  )

  const newThisMonth = versions.filter((version) => isWithinDays(version.createdAtISO, 30)).length

  return {
    total: versions.length,
    newThisMonth,
    live: live ? { tag: live.tag, promotedAt: live.createdAt } : null,
    lastBuild: lastBuild
      ? {
          tag: lastBuild.tag,
          status: lastBuild.status?.content || '',
          createdAtISO: lastBuild.createdAtISO
        }
      : null,
    failed30Days: failedLast30 ? { tag: failedLast30.tag, reason: failedLast30.note || '' } : null
  }
}

const ENVIRONMENT_LABELS = {
  production: 'Production',
  staging: 'Staging',
  development: 'Development'
}

const ENVIRONMENT_ORDER = ['production', 'staging', 'development']

const STATUS_RANK = {
  Ready: 0,
  Building: 1,
  Draft: 2,
  Canceled: 3,
  Error: 4
}

// TODO: replace with per-environment domain endpoint once available.
// Domains are modeled here per environment to mirror the future API where each
// domain record carries its own `environment` field.
const buildDomainsForEnvironment = (workloadId, environment) => {
  const safeId = String(workloadId ?? 'default').slice(0, 8)
  const productionPrimary = `wl-${safeId}.map.azionedge.net`
  const customCnames = ['console.azion.com', 'storybook.azion.com']

  if (environment === 'production') {
    return [
      { hostname: productionPrimary, primary: true, environment },
      ...customCnames.map((hostname) => ({ hostname, primary: false, environment }))
    ]
  }

  if (environment === 'staging') {
    return [
      { hostname: `wl-${safeId}-stage.map.azionedge.net`, primary: true, environment },
      ...customCnames.map((hostname) => ({
        hostname: `staging.${hostname}`,
        primary: false,
        environment
      }))
    ]
  }

  if (environment === 'development') {
    return [{ hostname: `wl-${safeId}-dev.map.azionedge.net`, primary: true, environment }]
  }

  return [{ hostname: `wl-${safeId}-${environment}.map.azionedge.net`, primary: true, environment }]
}

const pickVersionForEnvironment = (versions) => {
  const ready = versions.filter((version) => version.status?.content === 'Ready')
  const live = ready.find((version) => version.isCurrent)
  if (live) return live

  const sortedReady = sortByDateDesc(ready)
  if (sortedReady.length) return sortedReady[0]

  const drafts = sortByDateDesc(versions.filter((version) => version.status?.content === 'Draft'))
  if (drafts.length) return drafts[0]

  return sortByDateDesc(versions)[0] || null
}

const sortEnvironmentsProductionFirst = (environments) => {
  return [...environments].sort((left, right) => {
    const leftIndex = ENVIRONMENT_ORDER.indexOf(left.value)
    const rightIndex = ENVIRONMENT_ORDER.indexOf(right.value)
    const leftKey = leftIndex === -1 ? Number.POSITIVE_INFINITY : leftIndex
    const rightKey = rightIndex === -1 ? Number.POSITIVE_INFINITY : rightIndex
    return leftKey - rightKey
  })
}

export const getWorkloadEnvironmentsService = async (workloadId) => {
  await simulateDelay(160)

  const versions = getVersions(workloadId)
  const grouped = new Map()
  for (const version of versions) {
    if (!version.environment) continue
    if (!grouped.has(version.environment)) grouped.set(version.environment, [])
    grouped.get(version.environment).push(version)
  }

  const environments = []
  for (const [environment, envVersions] of grouped.entries()) {
    const chosen = pickVersionForEnvironment(envVersions)
    environments.push({
      value: environment,
      label: ENVIRONMENT_LABELS[environment] || environment,
      version: chosen
        ? {
            id: chosen.id,
            tag: chosen.tag,
            name: chosen.name,
            status: chosen.status,
            isLive: Boolean(chosen.isCurrent),
            createdAt: chosen.createdAt
          }
        : null,
      domains: buildDomainsForEnvironment(workloadId, environment),
      resourcePack: chosen?.resourcePack || {}
    })
  }

  return { body: sortEnvironmentsProductionFirst(environments) }
}

// Re-exported so consumers can sort statuses consistently if needed.
export const workloadVersionStatusRank = STATUS_RANK

export const createWorkloadVersionService = async (workloadId, payload = {}) => {
  await simulateDelay()
  const versions = getVersions(workloadId)
  const tag = payload.tag || `v${(versions.length + 1).toString().padStart(2, '0')}.draft`
  const createdAtISO = new Date().toISOString()
  const created = {
    id: `${workloadId}-${tag}-${Date.now()}`,
    tag,
    name: payload.name || tag,
    environment: payload.environment || 'development',
    isCurrent: false,
    status: formatStatus('draft'),
    note: payload.description || '',
    resourcePack: payload.resourcePack || {},
    author: payload.author || 'guilherme.santana@azion.com',
    createdAtISO,
    createdAt: formatDateToDayMonthYearHour(createdAtISO)
  }
  versions.unshift(created)
  return { data: created }
}
