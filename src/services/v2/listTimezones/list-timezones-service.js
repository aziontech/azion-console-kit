import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { adaptTimezones } from './list-timezones-adapter'

export class ListTimezonesService extends BaseService {
  constructor() {
    super()
    this.graphqlURL = '/graphql'
  }

  #fetchTimezones = async () => {
    const { data } = await this.http.request({
      method: 'POST',
      url: `${this.graphqlURL}/cities/`,
      body: {
        query: 'query alltimezones { allTimezones }'
      }
    })

    return adaptTimezones(data.data)
  }

  listTimezones = async () => {
    return await this.useEnsureQueryData(queryKeys.timezones.list(), () => this.#fetchTimezones(), {
      persist: true
    })
  }
}

export const listTimezonesService = new ListTimezonesService()
