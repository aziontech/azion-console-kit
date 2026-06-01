import { ServiceOrdersAdapter } from './service-orders-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class ServiceOrdersService extends BaseService {
  #baseURL = '/edge_api/v4/service_orders'
  #plansURL = `${this.#baseURL}/plans`
  #currentPlanURL = `${this.#baseURL}/plans/current`
  #billingPaymentMethodsURL = `${this.#baseURL}/billing/payment_methods`

  listPlansService = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#plansURL
    })
    return ServiceOrdersAdapter.transformPlansList(response.data)
  }

  useListPlansQuery() {
    return this.useQuery(queryKeys.plans.list(), () => this.listPlansService(), {
      staleTime: this.toMilliseconds({ hours: 1 }),
      gcTime: this.toMilliseconds({ hours: 24 }),
      refetchOnMount: false,
      refetchOnWindowFocus: false
    })
  }

  getCurrentPlan = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#currentPlanURL
    })
    return ServiceOrdersAdapter.transformPlanDetailResponse(response.data)
  }

  listServiceOrders = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: {
        ...(params.page !== undefined && { page: params.page }),
        ...(params.pageSize !== undefined && { page_size: params.pageSize }),
        ...(params.status && { status: params.status }),
        ...(params.type && { type: params.type }),
        ...(params.fields && { fields: params.fields })
      }
    })
    return ServiceOrdersAdapter.transformListResponse(response.data)
  }

  getServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }

  getCurrentServiceOrder = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/current`
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }

  createServiceOrder = async (payload) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: ServiceOrdersAdapter.toCreatePayload(payload)
    })
    return ServiceOrdersAdapter.transformCreateResponse(response.data)
  }

  prepareSignupCheckout = async (payload) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/signup/checkout/prepare`,
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
      method: 'POST',
      url: `${this.#baseURL}/${id}/upgrade`,
      body: ServiceOrdersAdapter.toPlanChangePayload(payload)
    })
    return ServiceOrdersAdapter.transformUpgradeResponse(response.data)
  }

  downgradeServiceOrder = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/downgrade`,
      body: ServiceOrdersAdapter.toPlanChangePayload(payload)
    })
    return ServiceOrdersAdapter.transformDowngradeResponse(response.data)
  }

  cancelServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/cancel`,
      body: {}
    })
    return ServiceOrdersAdapter.transformCancelResponse(response.data)
  }

  cancelDowngradeServiceOrder = async (id) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/cancel_downgrade`,
      body: {}
    })
    return ServiceOrdersAdapter.transformCancelDowngradeResponse(response.data)
  }

  getBillingPaymentMethods = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#billingPaymentMethodsURL
    })
    return ServiceOrdersAdapter.transformBillingPaymentMethodsResponse(response.data)
  }

  createPaymentMethodSetupIntent = async () => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#billingPaymentMethodsURL}/setup_intents`,
      body: {}
    })
    return ServiceOrdersAdapter.transformSetupIntentResponse(response.data)
  }

  setDefaultPaymentMethod = async (paymentMethodId) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#billingPaymentMethodsURL}/${paymentMethodId}/set_default`,
      body: {}
    })
    return ServiceOrdersAdapter.transformSetDefaultPaymentMethodResponse(response.data)
  }
}

export const serviceOrdersService = new ServiceOrdersService()
