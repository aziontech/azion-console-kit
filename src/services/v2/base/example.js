import { BaseService, CACHE_TYPES } from './index'

export class ExampleService extends BaseService {
  async getData() {
    return this.useQuery(
      ['my-data'], 
      () => this.http.get('/data'),
      { 
        persistent: CACHE_TYPES.USER_PERSISTENT
      }
    )
  }

  async getUserData(userId) {
    return this.useQuery(
      ['user-data', userId],
      () => this.http.get(`/users/${userId}`),
      { 
        persistent: CACHE_TYPES.USER_PERSISTENT
      }
    )
  }

  async getFilteredData(status, page) {
    return this.useQuery(
      ['filtered-data', status, String(page)],
      () => this.http.get('/data', { params: { status, page } })
    )
  }

  async getGlobalData() {
    return this.useQuery(
      ['global-data'], 
      () => this.http.get('/global'),
      { 
        persistent: {
          type: CACHE_TYPES.GLOBAL_PERSISTENT,
          ttl: 60 * 60 * 1000
        }
      }
    )
  }

  async getUserProfile() {
    return this.useUserQuery(
      ['profile'],
      () => this.http.get('/profile')
    )
  }

  async getSystemConfig() {
    return this.useGlobalQuery(
      ['config'],
      () => this.http.get('/config')
    )
  }

  async getDataWithPreloadedCache() {
    return this.useQueryWithCache(
      ['important-data'],
      () => this.http.get('/important-data'),
      { persistent: CACHE_TYPES.USER_PERSISTENT }
    )
  }

  async updateProfile(data) {
    return this.useMutation(
      () => this.http.put('/profile', data),
      {
        invalidateQueries: [['profile'], ['user-data']]
      }
    )
  }
}