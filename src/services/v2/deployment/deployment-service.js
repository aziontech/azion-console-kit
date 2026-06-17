import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { DeploymentAdapter } from '@/services/v2/deployment/deployment-adapter'
import { deploymentListMockResponse } from '@/services/v2/deployment/deployment-list-mock'

// MOCK: temporary toggle. Set to false once the API is available; the mock
// branch below mimics page/search/ordering/filter so the Overview tab behaves
// the same against fixture data and the real endpoint.
const USE_LIST_MOCK = true

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
  item?.last_modified_by?.email || item?.last_modified_by?.user_id || ''

const ORDERING_FIELD_MAP = {
  name: (item) => String(item?.name ?? ''),
  last_modified: (item) => item?.updated_at ?? '',
  active: (item) => String(item?.state ?? ''),
  last_editor: (item) => editorOf(item),
  id: (item) => String(item?.id ?? '')
}

const applyMockListParams = (items, params = {}) => {
  let filtered = items

  const search = params.search
  if (search) {
    filtered = filtered.filter((item) => {
      const haystack = [
        item.id,
        item.name,
        item.deployment_version_policy,
        item.state,
        editorOf(item),
        ...(Array.isArray(item.allowed_resource_types) ? item.allowed_resource_types : [])
      ]
      return haystack.some((value) => includesNormalized(value, search))
    })
  }

  if (params.name) {
    filtered = filtered.filter((item) => includesNormalized(item.name, params.name))
  }
  if (params.id) {
    filtered = filtered.filter((item) => includesNormalized(item.id, params.id))
  }
  if (params.policy) {
    filtered = filtered.filter((item) =>
      matchEquals(item.deployment_version_policy, params.policy)
    )
  }
  if (params.state) {
    filtered = filtered.filter((item) => matchEquals(item.state, params.state))
  }
  if (params.last_editor) {
    filtered = filtered.filter((item) => includesNormalized(editorOf(item), params.last_editor))
  }

  if (params.ordering) {
    const desc = params.ordering.startsWith('-')
    const field = desc ? params.ordering.slice(1) : params.ordering
    const selector = ORDERING_FIELD_MAP[field]
    if (selector) {
      filtered = [...filtered].sort((a, b) => {
        const av = selector(a)
        const bv = selector(b)
        if (av === bv) return 0
        return (av < bv ? -1 : 1) * (desc ? -1 : 1)
      })
    }
  }

  const total = filtered.length
  const page = Math.max(1, Number(params.page) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || total || 1)
  const start = (page - 1) * pageSize
  const paged = filtered.slice(start, start + pageSize)

  return { results: paged, count: total }
}

export class DeploymentService extends BaseService {
  #baseURL = '/deployment-api/v1/deployments'

  #fetchList = async (params = {}) => {
    if (USE_LIST_MOCK) {
      const { results } = parseListResponse(deploymentListMockResponse)
      const { results: paged, count } = applyMockListParams(results, params)
      return {
        body: DeploymentAdapter.transformList(paged),
        count
      }
    }

    const { data } = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params
    })

    const { results, count } = parseListResponse(data)

    return {
      body: DeploymentAdapter.transformList(results),
      count
    }
  }

  prefetchList = (params = {}) => {
    return this.usePrefetchQuery(queryKeys.deployments.list(params), () => this.#fetchList(params))
  }

  listDeploymentsService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.deployments.list(params),
      () => this.#fetchList(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getDeploymentFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.deployments.all,
      id,
      listPath: 'body'
    })
  }

  getDeploymentByIdService = async (id) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  createDeploymentService = async (payload = {}) => {
    const body = DeploymentAdapter.transformCreatePayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  updateDeploymentService = async (id, payload = {}) => {
    const body = DeploymentAdapter.transformPatchPayload(payload)

    const { data } = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return {
      data: DeploymentAdapter.transformItem(parseItemResponse(data))
    }
  }

  deleteDeploymentService = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.deployments.all })

    return { success: true }
  }
}

export const deploymentService = new DeploymentService()
