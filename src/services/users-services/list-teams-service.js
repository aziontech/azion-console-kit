import { BaseService } from '@/services/v2/base/query/baseService'
import { makeTeamsBaseUrl } from './make-teams-base-url'

export const teamsKeys = {
  all: ['teams', 'list'],
  invalidate: () => teamsService.invalidateTeamsCache()
}

const adapt = (results) => {
  return results.map((item) => ({ label: item.name, value: item.id }))
}

class TeamsService extends BaseService {
  listTeams = async ({
    fields = '',
    ordering = 'name',
    page = 1,
    pageSize = 100,
    search = ''
  } = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: makeTeamsBaseUrl(),
      params: {
        ordering,
        page,
        page_size: pageSize,
        ...(search && { search }),
        ...(fields && { fields })
      }
    })

    if (!data || !Array.isArray(data.results)) {
      throw new Error('Invalid data structure: expected results array')
    }

    return adapt(data.results)
  }

  useListTeams = async () => {
    const queryKey = teamsKeys.all

    return this._ensureQueryData(queryKey, () => this.listTeams(), {
      cacheType: this.cacheType.SENSITIVE,
      refetchOnMount: true
    })
  }

  invalidateTeamsCache = async () => {
    await this.queryClient.removeQueries({ queryKey: teamsKeys.all })
  }
}

export const teamsService = new TeamsService()

/** @deprecated Use teamsService.listTeams() or teamsService.useListTeams() instead */
export const listTeamsService = async () => {
  return teamsService.useListTeams()
}
