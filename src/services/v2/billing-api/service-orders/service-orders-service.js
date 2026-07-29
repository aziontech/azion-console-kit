import { ServiceOrdersAdapter } from './service-orders-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { generateIdempotencyKey } from '@/services/v2/utils/idempotency-key'

export class ServiceOrdersService extends BaseService {
  #baseURL = '/v4/account/service_orders'
  #subscriptionsURL = '/v4/account/subscriptions'

  #idempotencyConfig = (idempotencyKey) => ({
    headers: { 'idempotency-key': idempotencyKey ?? generateIdempotencyKey() }
  })

  listServiceOrders = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: ServiceOrdersAdapter.toListParams(params)
    })
    return ServiceOrdersAdapter.transformListResponse(response.data)
  }

  createServiceOrder = async ({ payload } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: ServiceOrdersAdapter.toCreatePayload(payload)
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }

  listSubscriptionServiceOrders = async ({ subscriptionId, params = {} } = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#subscriptionsURL}/${subscriptionId}/service_orders`,
      params: ServiceOrdersAdapter.toFieldsParams(params)
    })
    return ServiceOrdersAdapter.transformListResponse(response.data)
  }

  getServiceOrder = async (serviceOrderId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${serviceOrderId}`
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }

  updateServiceOrder = async ({ serviceOrderId, payload } = {}) => {
    const response = await this.http.request({
      method: 'PATCH',
      url: `${this.#baseURL}/${serviceOrderId}`,
      body: ServiceOrdersAdapter.toUpdatePayload(payload)
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }

  listServiceOrderActions = async (serviceOrderId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${serviceOrderId}/actions`
    })
    return ServiceOrdersAdapter.transformActionsListResponse(response.data)
  }

  createServiceOrderAction = async ({ serviceOrderId, payload, idempotencyKey } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${serviceOrderId}/actions`,
      body: ServiceOrdersAdapter.toActionPayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return ServiceOrdersAdapter.transformActionDetailResponse(response.data)
  }

  getServiceOrderTerms = async (serviceOrderId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${serviceOrderId}/terms`
    })
    return ServiceOrdersAdapter.transformTermsResponse(response.data)
  }

  cancelServiceOrder = async ({ serviceOrderId, payload } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${serviceOrderId}/cancel`,
      body: ServiceOrdersAdapter.toCancelPayload(payload)
    })
    return ServiceOrdersAdapter.transformDetailResponse(response.data)
  }
}

export const serviceOrdersService = new ServiceOrdersService()
