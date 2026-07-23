import { SubscriptionsAdapter } from './subscriptions-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
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
    return SubscriptionsAdapter.transformListResponse(response.data)
  }

  useListSubscriptionsQuery(params = {}) {
    return this.useQuery(queryKeys.subscriptions.list(params), () => this.listSubscriptions(params))
  }

  getSubscription = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}`
    })
    return SubscriptionsAdapter.transformDetailResponse(response.data)
  }

  getCurrentSubscription = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/current`
    })
    return SubscriptionsAdapter.transformDetailResponse(response.data)
  }

  createSubscription = async (payload, { idempotencyKey } = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: this.#baseURL,
      body: SubscriptionsAdapter.toCreatePayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return SubscriptionsAdapter.transformCreateResponse(response.data)
  }

  changeSubscription = async ({ id, payload, idempotencyKey }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/change`,
      body: SubscriptionsAdapter.toChangePayload(payload),
      config: this.#idempotencyConfig(idempotencyKey)
    })
    return SubscriptionsAdapter.transformDetailResponse(response.data)
  }

  previewSubscriptionChange = async ({ id, payload }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/change/preview`,
      body: SubscriptionsAdapter.toChangePayload(payload)
    })
    return SubscriptionsAdapter.transformChangePreviewResponse(response.data)
  }

  cancelSubscription = async ({ id, payload = {} }) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/${id}/cancel`,
      body: SubscriptionsAdapter.toCancelPayload(payload)
    })
    return SubscriptionsAdapter.transformDetailResponse(response.data)
  }

  listSubscriptionVersions = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/versions`
    })
    return SubscriptionsAdapter.transformVersionsListResponse(response.data)
  }

  listScheduledChanges = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/scheduled_changes`
    })
    return SubscriptionsAdapter.transformScheduledChangesListResponse(response.data)
  }

  getScheduledChange = async ({ id, scheduledChangeId }) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/${id}/scheduled_changes/${scheduledChangeId}`
    })
    return SubscriptionsAdapter.transformScheduledChangeDetailResponse(response.data)
  }

  deleteScheduledChange = async ({ id, scheduledChangeId }) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/${id}/scheduled_changes/${scheduledChangeId}`
    })
    return { id: scheduledChangeId }
  }
}

export const subscriptionsService = new SubscriptionsService()
