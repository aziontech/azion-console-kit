import { BaseService } from '@/services/v2/base/query/baseService'
import { VcsAdapter } from './vcs-adapter'
export class VcsService extends BaseService {
  constructor() {
    super()
    this.adapter = VcsAdapter
    this.baseURL = 'v4/vcs'
  }

  listIntegrations = async (params = { pageSize: 100 }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations`,
      params
    })
    return this.adapter?.transformListIntegrations?.(data.results) ?? data.results
  }

  listPlatforms = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/providers`
    })
    return this.adapter?.transformListPlatforms?.(data.results) ?? data.results
  }

  listRepositories = async (id, params = { pageSize: 100, ordering: 'name' }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/integrations/${id}/repositories`,
      params
    })
    return data.results
  }

  postCallbackUrl = async (path, body) => {
    if (!path) {
      throw new Error('the integration callback URL was not received. Please try connecting again')
    }
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}${path}`,
      body
    })
    return data.results
  }

  deleteIntegration = async (id) => {
    const { data } = await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/integrations/${id}`
    })
    return data.results
  }
}

export const vcsService = new VcsService()
