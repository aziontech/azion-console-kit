import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { makeTeamPermissionBaseUrl } from './make-team-permission-base-url'

const parseStatusData = (status) => {
  return status
    ? { content: 'Active', severity: 'success' }
    : { content: 'Inactive', severity: 'danger' }
}

const adaptList = (results) => {
  if (!Array.isArray(results)) return []

  return results.map((team) => ({
    id: team.id,
    name: team.name,
    permissions: team.permissions?.length ? team.permissions.map((item) => item.name) : [],
    status: parseStatusData(team.is_active)
  }))
}

class TeamPermissionService extends BaseService {
  constructor() {
    super()
    this.baseURL = makeTeamPermissionBaseUrl()
  }

  #fetchTeamPermissionList = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        ordering: 'name',
        page: 1,
        page_size: 100,
        ...params
      }
    })

    return {
      body: adaptList(data.results),
      count: data.count
    }
  }

  prefetchList = (pageSize = 10) => {
    const defaultParams = {
      ordering: 'name',
      page: 1,
      pageSize
    }
    return this.usePrefetchQuery(queryKeys.teamPermission.list(defaultParams), () =>
      this.#fetchTeamPermissionList(defaultParams)
    )
  }

  listTeamPermissionService = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.teamPermission.list(params),
      () => this.#fetchTeamPermissionList(params),
      {
        persist: firstPage && !skipCache,
        skipCache
      }
    )
  }

  getTeamPermissionFromCache = (id) => {
    if (!id) return undefined

    return super.getFromCache({
      queryKey: queryKeys.teamPermission.all,
      id,
      listPath: 'body',
      select: (item) => ({
        id: item.id,
        name: item.name,
        isActive: item.status?.content === 'Active'
      })
    })
  }

  invalidateCache = async () => {
    await this.queryClient.removeQueries({ queryKey: queryKeys.teamPermission.all })
  }
}

export const teamPermissionService = new TeamPermissionService()
