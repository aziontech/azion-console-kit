import { BaseService } from '@/services/v2/base/query/baseService'
import { TeamPermissionAdapter } from './team-permission-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class TeamPermissionService extends BaseService {
  constructor() {
    super()
    this.adapter = TeamPermissionAdapter
    this.baseURL = 'v4/iam/teams'
    this.permissionsBaseURL = 'v4/iam/permissions'
  }

  #fetchList = async (params = {}) => {
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
      body: this.adapter.transformList(data.results),
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
      this.#fetchList(defaultParams)
    )
  }

  list = async (params = {}) => {
    const firstPage = params?.page === 1
    const skipCache = params?.skipCache || params?.hasFilter || params?.search

    return await this.useEnsureQueryData(
      queryKeys.teamPermission.list(params),
      () => this.#fetchList(params),
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

  load = async ({ id }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`
    })

    return this.adapter.transformItem(data.data)
  }

  create = async (payload) => {
    const body = this.adapter.transformPayload(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.teamPermission.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.teams.all })

    return {
      id: data.data.id,
      feedback: 'Your Team Permission has been created',
      urlToEditView: `/teams-permission/edit/${data.data.id}`
    }
  }

  edit = async (payload) => {
    const body = this.adapter.transformPayload(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.teamPermission.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.teams.all })

    return 'Your Team Permission has been updated'
  }

  delete = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.teamPermission.all })
    this.queryClient.removeQueries({ queryKey: queryKeys.teams.all })

    return 'Team Permission successfully deleted'
  }

  listPermissions = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.permissionsBaseURL,
      params: {
        page_size: 100
      }
    })

    return data.results
  }

  invalidateCache = async () => {
    await this.queryClient.removeQueries({ queryKey: queryKeys.teamPermission.all })
  }
}

export const teamPermissionService = new TeamPermissionService()
