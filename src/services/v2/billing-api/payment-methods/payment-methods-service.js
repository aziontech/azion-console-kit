import { PaymentMethodsAdapter } from './payment-methods-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class PaymentMethodsService extends BaseService {
  #baseURL = '/v4/account/payments'

  listPaymentMethods = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/payment_methods`
    })
    return PaymentMethodsAdapter.transformList(response.data)
  }

  listPaymentMethodsWithMeta = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/payment_methods`
    })
    return {
      paymentMethods: PaymentMethodsAdapter.transformList(response.data),
      isStale: PaymentMethodsAdapter.readStaleFlag(response.headers)
    }
  }

  useListPaymentMethodsQuery() {
    return this.useQuery(queryKeys.paymentMethods.list(), () => this.listPaymentMethods())
  }

  createSetupSession = async (payload = {}) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/payment_setup_sessions`,
      body: PaymentMethodsAdapter.toSetupSessionPayload(payload)
    })
    return PaymentMethodsAdapter.transformSetupSession(response.data)
  }

  getPaymentMethod = async (id) => {
    const response = await this.http.request({
      method: 'GET',
      url: `${this.#baseURL}/payment_methods/${id}`
    })
    return PaymentMethodsAdapter.transformPaymentMethod(response.data)
  }

  deletePaymentMethod = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.#baseURL}/payment_methods/${id}`
    })
    return { id }
  }

  setDefaultPaymentMethod = async (id) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#baseURL}/payment_methods/${id}/default`
    })
    return PaymentMethodsAdapter.transformPaymentMethod(response.data)
  }
}

export const paymentMethodsService = new PaymentMethodsService()
