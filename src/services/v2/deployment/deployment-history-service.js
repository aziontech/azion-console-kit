import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentVersionAdapter } from '@/services/v2/deployment/deployment-version-adapter'
import { deploymentHistoryMockResponse } from '@/services/v2/deployment/deployment-history-mock'

// MOCK: temporary toggle. Set to false once the API is available; the mock
// branch below mimics page/search/state/environment/ordering so the History tab
// behaves the same against fixture data and the real endpoint.
const USE_HISTORY_MOCK = true

const parseListResponse = (data) => {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length
    }
  }

  const results = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data?.data)
      ? data.data
      : []

  return {
    results,
    count: data?.count ?? results.length
  }
}

const parseItemResponse = (data) => {
  if (data && typeof data === 'object' && !Array.isArray(data) && data.data) {
    return data.data
  }

  return data
}

const includesNormalized = (value, needle) => {
  if (needle == null || needle === '') return true
  return String(value ?? '')
    .toLowerCase()
    .includes(String(needle).toLowerCase())
}

const matchEquals = (value, expected) => {
  if (expected == null || expected === '') return true
  return String(value ?? '').toLowerCase() === String(expected).toLowerCase()
}

const editorOf = (item) =>
  item?.audit?.requested_by_email ||
  item?.last_modified_by?.email ||
  item?.audit?.requested_by_user_id ||
  ''

const ENV_LABEL_BY_ROLE = {
  ACTIVE: 'production',
  CANDIDATE: 'canary',
  VALID_URL: 'stage',
  INACTIVE: 'stage'
}

const matchesEnvironment = (item, expected) => {
  if (!expected) return true
  const target = String(expected).toLowerCase()
  const role = item?.traffic_role
  if (!role) return false
  return ENV_LABEL_BY_ROLE[role] === target || role.toLowerCase() === target
}

const ORDERING_FIELD_MAP = {
  created_at: (item) => item?.created_at ?? '',
  state: (item) => String(item?.state ?? ''),
  id: (item) => String(item?.id ?? '')
}

const applyMockHistoryParams = (items, params = {}) => {
  let filtered = items

  if (params.search) {
    filtered = filtered.filter((item) =>
      [item.id, item.name, item.deployment_id, item.state, editorOf(item)].some((value) =>
        includesNormalized(value, params.search)
      )
    )
  }

  if (params.state) {
    filtered = filtered.filter((item) => matchEquals(item.state, params.state))
  }

  if (params.environment) {
    filtered = filtered.filter((item) => matchesEnvironment(item, params.environment))
  }

  if (params.ordering) {
    const desc = params.ordering.startsWith('-')
    const field = desc ? params.ordering.slice(1) : params.ordering
    const selector = ORDERING_FIELD_MAP[field]
    if (selector) {
      filtered = [...filtered].sort((itemA, itemB) => {
        const av = selector(itemA)
        const bv = selector(itemB)
        if (av === bv) return 0
        return (av < bv ? -1 : 1) * (desc ? -1 : 1)
      })
    }
  } else {
    // Default: newest first by created_at
    filtered = [...filtered].sort((itemA, itemB) => {
      const av = itemA?.created_at ?? ''
      const bv = itemB?.created_at ?? ''
      if (av === bv) return 0
      return av < bv ? 1 : -1
    })
  }

  const total = filtered.length
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || total || 1)
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  return { results: paged, count: total }
}

export class DeploymentHistoryService extends BaseService {
  #baseURL = '/deployment-api/v1/deployments'

  #fetchGlobal = async (params = {}) => {
    if (USE_HISTORY_MOCK) {
      const { results } = parseListResponse(deploymentHistoryMockResponse)
      const { results: paged, count } = applyMockHistoryParams(results, params)
      return {
        body: DeploymentVersionAdapter.transformList(paged),
        count
      }
    }

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/history`,
      params
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentVersionAdapter.transformList(results),
      count
    }
  }

  #fetchByDeployment = async (deploymentId, params = {}) => {
    if (USE_HISTORY_MOCK) {
      const { results } = parseListResponse(deploymentHistoryMockResponse)
      const scoped = results.filter((item) => item.deployment_id === deploymentId)
      const { results: paged, count } = applyMockHistoryParams(scoped, params)
      return {
        body: DeploymentVersionAdapter.transformList(paged),
        count
      }
    }

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${deploymentId}/history`,
      params
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentVersionAdapter.transformList(results),
      count
    }
  }

  listGlobalHistoryService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.history.global(params),
      () => this.#fetchGlobal(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  listDeploymentHistoryService = async (deploymentId, params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.history.byDeployment(deploymentId, params),
      () => this.#fetchByDeployment(deploymentId, params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  diffVersionsService = async (deploymentId, { from, to } = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${deploymentId}/versions/diff`,
      params: { from, to }
    })

    return {
      data: DeploymentVersionAdapter.transformDiff(parseItemResponse(data))
    }
  }
}

export const deploymentHistoryService = new DeploymentHistoryService()
