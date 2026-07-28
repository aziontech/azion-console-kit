import { SubscriptionsAdapter } from './subscriptions-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { generateIdempotencyKey } from '@/services/v2/utils/idempotency-key'

export class SubscriptionsService extends BaseService {
  #baseURL = '/v4/account/subscriptions'

  #idempotencyConfig = (idempotencyKey) => ({
    headers: { 'idempotency-key': idempotencyKey ?? generateIdempotencyKey() }
  })

  listSubscriptions = async (params = {}) => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#baseURL,
      params: SubscriptionsAdapter.toListParams(params)
    })
    return SubscriptionsAdapter.transformSubscriptionsListResponse(response.data)
  }

  getCurrentSubscription = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/current`
    })
    return SubscriptionsAdapter.transformSubscriptionDetailResponse(response.data)
  }

  getSubscription = async (subscriptionId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${subscriptionId}`
    })
    return SubscriptionsAdapter.transformSubscriptionDetailResponse(response.data)
  }

  listSubscriptionVersions = async (subscriptionId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${subscriptionId}/versions`
    })
    return SubscriptionsAdapter.transformVersionsListResponse(response.data)
  }

  createSubscription = async ({ payload, idempotencyKey } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: SubscriptionsAdapter.toCreatePayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return SubscriptionsAdapter.transformCreateResponse(response.data)
  }

  cancelSubscription = async ({ subscriptionId, payload, idempotencyKey } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${subscriptionId}/cancel`,
      body: SubscriptionsAdapter.toCancelPayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return SubscriptionsAdapter.transformSubscriptionDetailResponse(response.data)
  }

  changeSubscription = async ({ serviceOrderId, payload, idempotencyKey }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${serviceOrderId}/change`,
      body: SubscriptionsAdapter.toChangePayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return SubscriptionsAdapter.transformChangeResponse(response.data)
  }

  previewSubscriptionChange = async ({ serviceOrderId, payload }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${serviceOrderId}/change/preview`,
      body: SubscriptionsAdapter.toChangePayload(payload)
    })
    return SubscriptionsAdapter.transformChangePreviewResponse(response.data)
  }

  listScheduledChanges = async (serviceOrderId) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${serviceOrderId}/scheduled_changes`
    })
    return SubscriptionsAdapter.transformScheduledChangesListResponse(response.data)
  }

  getScheduledChange = async ({ serviceOrderId, scheduledChangeId }) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${serviceOrderId}/scheduled_changes/${scheduledChangeId}`
    })
    return SubscriptionsAdapter.transformScheduledChangeDetailResponse(response.data)
  }

  deleteScheduledChange = async ({ serviceOrderId, scheduledChangeId }) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${serviceOrderId}/scheduled_changes/${scheduledChangeId}`
    })
    return { id: scheduledChangeId }
  }
}

export const subscriptionsService = new SubscriptionsService()
