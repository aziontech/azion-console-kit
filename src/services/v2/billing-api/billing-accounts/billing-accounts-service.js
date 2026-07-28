import { BillingAccountsAdapter } from './billing-accounts-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class BillingAccountsService extends BaseService {
  #baseURL = '/v4/billing_accounts'

  listBillingAccounts = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: BillingAccountsAdapter.toListParams(params)
    })
    return BillingAccountsAdapter.transformListResponse(response.data)
  }

  useListBillingAccountsQuery(params = {}) {
    return this.useQuery(queryKeys.billingAccounts.list(params), () =>
      this.listBillingAccounts(params)
    )
  }

  createBillingAccount = async (payload) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: BillingAccountsAdapter.toCreatePayload(payload)
    })
    return BillingAccountsAdapter.transformDetailResponse(response.data)
  }

  getCurrentBillingAccount = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/current`
    })
    return BillingAccountsAdapter.transformDetailResponse(response.data)
  }

  getBillingAccount = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })
    return BillingAccountsAdapter.transformDetailResponse(response.data)
  }

  updateBillingAccount = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body: BillingAccountsAdapter.toUpdatePayload(payload)
    })
    return BillingAccountsAdapter.transformDetailResponse(response.data)
  }

  getCostBreakdown = async ({ id, period }) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/cost_breakdown`,
      params: BillingAccountsAdapter.toCostBreakdownParams({ period })
    })
    return BillingAccountsAdapter.transformCostBreakdownResponse(response.data)
  }
}

export const billingAccountsService = new BillingAccountsService()
