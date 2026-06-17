import { ServiceOrdersAdapter } from './service-orders-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class ServiceOrdersService extends BaseService {
  // Production: '/v4/service-orders'
  // Local dev with mock: '/local_api/v4/service-orders'
  #baseURL = '/edge_api/api/v1/service_orders'

  // Plans endpoint
  // Production: '/v4/product_catalog/plans'
  // Local dev with mock: '/local_api/v4/product_catalog/plans'
  #plansBaseURL = '/edge_api/api/v1/plans'

  listPlansService = async () => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.#plansBaseURL
    })

    return ServiceOrdersAdapter.transformPlansList(data?.data ?? data)
  }

  // Plan catalogue is effectively static (SKUs, pricings, IDs) — the backend
  // updates it only on product launches. Cache aggressively to avoid the
  // checkout / billing UI re-fetching it on every mount.
  //   - staleTime 1h: avoid refetch within a session
  //   - gcTime 24h:   survive the user navigating away and coming back
  //   - refetchOnMount: only when stale
  //   - refetchOnWindowFocus: disabled (catalogue doesn't change mid-session)
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
      url: this.#baseURL,
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
      url: `${this.#baseURL}/${id}`
    })

    const body = response?.data ?? {}
    // Backend may envelope the SO as { data }, { results }, or expose it
    // directly on the body. Pick whichever shape carries the SO fields.
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

  upgradeServiceOrder = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}/upgrade`,
      body: ServiceOrdersAdapter.toUpgradePayload(payload)
    })

    return ServiceOrdersAdapter.transformUpgradeResponse(response.data)
  }

  downgradeServiceOrder = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${id}/downgrade`,
      body: ServiceOrdersAdapter.toDowngradePayload(payload)
    })

    return ServiceOrdersAdapter.transformDowngradeResponse(response.data)
  }
}

export const serviceOrdersService = new ServiceOrdersService()
