import { HubspotAdapter } from './hubspot-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'

export class HubspotService extends BaseService {
  #baseUrl = import.meta.env.VITE_HUBSPOT_API_URL || 'https://www.azion.com/api'
  #basePath = '/hubspot/events'

  #buildUrl() {
    return { url: `${this.#baseUrl}${this.#basePath}`, config: {} }
  }

  submitForm = async (payload) => {
    const validation = HubspotAdapter.validatePayload(payload)
    if (!validation.isValid) {
      return { success: false, error: validation.errors.join('; ') }
    }

    try {
      const { url, config } = this.#buildUrl()
      const body = HubspotAdapter.transformPayload(payload)

      await this.http.request({
        url,
        method: 'POST',
        body,
        config,
        headers: { 'Content-Type': 'application/json' }
      })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMessage }
    }
  }
}

export const hubspotService = new HubspotService()
