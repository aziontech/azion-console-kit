import { ServiceOrdersAdapter } from './service-orders-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class ServiceOrdersService extends BaseService {
  // Production: '/v4/service-orders'
  // Local dev with mock: '/local_api/v4/service-orders'
  #baseURL = '/edge_api/api/v1/service_orders'

  // Plans and Coupons endpoints
  // Production: '/v4/product_catalog/plans' and '/v4/product_catalog/coupons'
  // Local dev with mock: '/local_api/v4/product_catalog/...'
  #plansBaseURL = '/edge_api/api/v1/plans'
  #couponsBaseURL = '/local_api/v4/product_catalog/coupons'

  listPlansService = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#plansBaseURL
    })
    return ServiceOrdersAdapter.transformPlansList(data.data ?? [])
  }

  listPlansWithCache = async () => {
    const queryKey = queryKeys.plans.list()

    return await this.useEnsureQueryData(queryKey, () => this.listPlansService(), {
      cacheType: this.cacheType.STATIC
    })
  }

  useListPlansQuery() {
    return this.useQuery(queryKeys.plans.list(), () => this.listPlansService(), {
      cacheType: this.cacheType.STATIC,
      enabled: true
    })
  }

  validateCouponService = async ({ code, planId, accountId, email }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#couponsBaseURL}/validate`,
      body: {
        code,
        plan_id: planId,
        ...(accountId && { account_id: accountId }),
        ...(email && { email })
      }
    })
    return ServiceOrdersAdapter.transformCouponValidation(response.data?.data)
  }

  listServiceOrders = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: {
        ...(params.limit !== undefined && { limit: params.limit }),
        ...(params.offset !== undefined && { offset: params.offset }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...{ account_id: params.accountId }
      }
    })

    return ServiceOrdersAdapter.transformListResponse(response.data)
  }

  getServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })

    return {
      success: response.data?.success,
      data: ServiceOrdersAdapter.transformServiceOrder(response.data?.data),
      meta: ServiceOrdersAdapter.transformMeta(response.data?.meta)
    }
  }

  createServiceOrder = async (payload) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: ServiceOrdersAdapter.toCreatePayload(payload)
    })

    return ServiceOrdersAdapter.transformCreateResponse(response.data)
  }

  updateServiceOrder = async (id, payload) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}`,
      body: ServiceOrdersAdapter.toUpdatePayload(payload)
    })

    return ServiceOrdersAdapter.transformUpdateResponse(response.data)
  }
}

export const serviceOrdersService = new ServiceOrdersService()
