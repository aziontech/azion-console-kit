import { CreditsAdapter } from './credits-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class CreditsService extends BaseService {
  #baseURL = '/v4/account/billing'

  getCreditBalance = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/balance`
    })
    return CreditsAdapter.transformBalanceResponse(response.data)
  }

  useCreditBalanceQuery() {
    return this.useQuery(queryKeys.credits.balance(), () => this.getCreditBalance())
  }

  listCredits = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/credits`,
      params: CreditsAdapter.toListParams(params)
    })
    return CreditsAdapter.transformListResponse(response.data)
  }

  useListCreditsQuery(params = {}) {
    return this.useQuery(queryKeys.credits.list(params), () => this.listCredits(params))
  }
}

export const creditsService = new CreditsService()
