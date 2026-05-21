import { BaseService } from '@/services/v2/base/query/baseService'
import { ServiceOrdersAdapter } from '@/services/v2/service-orders/service-orders-adapter'

// Current-account endpoints for resolving the authenticated account's active
// subscription state. A 404 from either endpoint is normalized to
// `{ data: null }`; other non-2xx responses propagate so Vue Query can mark
// the query as errored and surface it to the UI.
const NOT_FOUND_STATUS = 404

const isNotFound = (error) =>
  error?.statusCode === NOT_FOUND_STATUS ||
  error?.response?.status === NOT_FOUND_STATUS ||
  error?.status === NOT_FOUND_STATUS

export class AccountCurrentService extends BaseService {
  #baseURL = '/edge_api/api/v1/account'

  fetchCurrentServiceOrder = async () => {
    try {
      const response = await this.http.request({
        method: 'GET',
        url: `${this.#baseURL}/service_order`
      })
      const body = response?.data ?? {}
      const so = body.data ?? (Array.isArray(body.results) ? body.results[0] : body.results) ?? body
      return so && typeof so === 'object'
        ? { data: ServiceOrdersAdapter.transformServiceOrder(so) }
        : { data: null }
    } catch (error) {
      if (isNotFound(error)) return { data: null }
      throw error
    }
  }

  fetchCurrentPlan = async () => {
    try {
      const response = await this.http.request({
        method: 'GET',
        url: `${this.#baseURL}/plan`
      })
      const body = response?.data ?? {}
      const plan = body.data ?? body
      return plan && typeof plan === 'object'
        ? { data: ServiceOrdersAdapter.transformPlan(plan) }
        : { data: null }
    } catch (error) {
      if (isNotFound(error)) return { data: null }
      throw error
    }
  }
}

export const accountCurrentService = new AccountCurrentService()
