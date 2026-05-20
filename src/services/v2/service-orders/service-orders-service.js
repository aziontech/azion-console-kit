import { ServiceOrdersAdapter } from './service-orders-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class ServiceOrdersService extends BaseService {
  #baseURL = '/edge_api/api/v1'
  #serviceOrdersURL = `${this.#baseURL}/service_orders`
  #plansURL = `${this.#baseURL}/plans`
  #accountPlanURL = `${this.#baseURL}/account/plan`

  listPlansService = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#plansURL
    })

    return ServiceOrdersAdapter.transformPlansList(data?.data ?? data)
  }

  getAccountPlanStatus = async () => {
    try {
      await this.http.request({
        method: 'GET',
        url: this.#accountPlanURL
      })
      return true
    } catch {
      return false
    }
  }

  // Plan catalogue is effectively static — cache aggressively to avoid the
  // checkout / billing UI re-fetching it on every mount.
  useListPlansQuery() {
    return this.useQuery(queryKeys.plans.list(), () => this.listPlansService(), {
      staleTime: this.toMilliseconds({ hours: 1 }),
      gcTime: this.toMilliseconds({ hours: 24 }),
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      enabled: true
    })
  }

  listServiceOrders = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#serviceOrdersURL,
      params: {
        ...(params.limit !== undefined && { limit: params.limit }),
        ...(params.offset !== undefined && { offset: params.offset }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        accountId: params.accountId
      }
    })

    return ServiceOrdersAdapter.transformListResponse(response.data)
  }

  getServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#serviceOrdersURL}/${id}`
    })

    const body = response?.data ?? {}
    const raw =
      (body.data && typeof body.data === 'object' && body.data) ??
      (Array.isArray(body.results) ? body.results[0] : body.results) ??
      body

    return {
      success: body.success,
      data: ServiceOrdersAdapter.transformServiceOrder(raw),
      meta: ServiceOrdersAdapter.transformMeta(body.meta)
    }
  }

  createServiceOrder = async (payload) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#serviceOrdersURL,
      body: ServiceOrdersAdapter.toCreatePayload(payload)
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })

    return ServiceOrdersAdapter.transformCreateResponse(response.data)
  }

  updateServiceOrder = async (id, payload) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#serviceOrdersURL}/${id}`,
      body: ServiceOrdersAdapter.toUpdatePayload(payload)
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })

    return ServiceOrdersAdapter.transformUpdateResponse(response.data)
  }

  upgradeServiceOrder = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#serviceOrdersURL}/${id}/upgrade`,
      body: ServiceOrdersAdapter.toUpgradePayload(payload)
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })

    return ServiceOrdersAdapter.transformUpgradeResponse(response.data)
  }

  downgradeServiceOrder = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#serviceOrdersURL}/${id}/downgrade`,
      body: ServiceOrdersAdapter.toDowngradePayload(payload)
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })

    return ServiceOrdersAdapter.transformDowngradeResponse(response.data)
  }

  cancelDowngradeServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'DELETE',
      url: `${this.#serviceOrdersURL}/${id}/cancel_downgrade`
    })

    this.queryClient.invalidateQueries({ queryKey: queryKeys.serviceOrders.all })

    return ServiceOrdersAdapter.transformCancelDowngradeResponse(response.data)
  }
}

export const serviceOrdersService = new ServiceOrdersService()
