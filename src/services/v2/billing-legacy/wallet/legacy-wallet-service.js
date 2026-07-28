import { LegacyWalletAdapter } from './legacy-wallet-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

/**
 * Legacy service-order surface, kept only for the managed billing experience
 * (`billing_type` `internal` / `custom`), whose wallet still lives here. The
 * plans experience reads and writes everything through billing-api v4 —
 * `src/services/v2/billing-api/`.
 */
export class LegacyWalletService extends BaseService {
  #billingPaymentMethodsURL = '/edge_api/v4/service_orders/billing/payment_methods'

  getBillingPaymentMethods = async () => {
    const response = await this.http.request({
      method: 'GET',
      url: this.#billingPaymentMethodsURL
    })
    return LegacyWalletAdapter.transformBillingPaymentMethodsResponse(response.data)
  }

  createPaymentMethodSetupIntent = async () => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#billingPaymentMethodsURL}/setup_intents`,
      body: {}
    })
    return LegacyWalletAdapter.transformSetupIntentResponse(response.data)
  }

  setDefaultPaymentMethod = async (paymentMethodId) => {
    const response = await this.http.request({
      method: 'POST',
      url: `${this.#billingPaymentMethodsURL}/${paymentMethodId}/set_default`,
      body: {}
    })
    return LegacyWalletAdapter.transformSetDefaultPaymentMethodResponse(response.data)
  }
}

export const legacyWalletService = new LegacyWalletService()
