import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { EnvironmentAdapter } from '@/services/v2/environment/environment-adapter'
import {
  listEnvironmentsService as listEnvironmentsMock,
  getEnvironmentByIdService as getEnvironmentByIdMock,
  createEnvironmentService as createEnvironmentMock,
  updateEnvironmentService as updateEnvironmentMock,
  deleteEnvironmentService as deleteEnvironmentMock
} from '@/services/v2/environment/environment-mock'

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

export class EnvironmentService extends BaseService {
  #baseURL = 'v4/environments'

  // TODO: replace mock call with `this.http.request({ method: 'GET', url: this.#baseURL, params })`
  // once `v4/environments` is available. The downstream pipeline (parseListResponse +
  // EnvironmentAdapter.transformList) already matches the V4 list envelope.
  #fetchList = async (params = {}) => {
    const data = await listEnvironmentsMock(params)

    const { results, count } = parseListResponse(data)

    return {
      body: EnvironmentAdapter.transformList(results),
      count
    }
  }

  // TODO: collapse into #fetchList once `v4/environments` is available.
  #fetchDropdown = async (params = {}) => {
    const data = await listEnvironmentsMock(params)
    const { results, count } = parseListResponse(data)

    const body = results.map((env) => ({
      id: env.id,
      name: env.name,
      value: env.id,
      deployment_version_policy: env.deployment_version_policy
    }))

    return { body, count }
  }

  listEnvironmentsServiceDropdown = this.#fetchDropdown

  loadEnvironmentService = async ({ id }) => {
    const raw = await getEnvironmentByIdMock(id)
    const data = parseItemResponse(raw)
    return {
      id: data.id,
      name: data.name,
      value: data.id,
      deployment_version_policy: data.deployment_version_policy
    }
  }

  prefetchList = (params = {}) => {
    return this.usePrefetchQuery(queryKeys.environments.list(params), () => this.#fetchList(params))
  }

  listEnvironmentsService = async (params = {}) => {
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.environments.list(params),
      () => this.#fetchList(params),
      {
        persist: !skipCache,
        skipCache
      }
    )
  }

  getEnvironmentFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.environments.all,
      id,
      listPath: 'body'
    })
  }

  // TODO: replace mock call with `this.http.request({ method: 'GET', url: ... })`
  // once `v4/environments` is available.
  getEnvironmentByIdService = async (id) => {
    const raw = await getEnvironmentByIdMock(id)

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  // TODO: replace mock call with `this.http.request({ method: 'POST', ... })`
  // once `v4/environments` is available.
  createEnvironmentService = async (payload = {}) => {
    const body = EnvironmentAdapter.transformCreatePayload(payload)

    const raw = await createEnvironmentMock(body)

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  // TODO: replace mock call with `this.http.request({ method: 'PATCH', ... })`
  // once `v4/environments` is available.
  updateEnvironmentService = async (id, payload = {}) => {
    const body = EnvironmentAdapter.transformPatchPayload(payload)

    const raw = await updateEnvironmentMock(id, body)

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return {
      data: EnvironmentAdapter.transformItem(parseItemResponse(raw))
    }
  }

  // TODO: replace mock call with `this.http.request({ method: 'DELETE', ... })`
  // once `v4/environments` is available.
  deleteEnvironmentService = async (id) => {
    await deleteEnvironmentMock(id)

    this.queryClient.removeQueries({ queryKey: queryKeys.environments.all })

    return { success: true }
  }
}

export const environmentService = new EnvironmentService()
