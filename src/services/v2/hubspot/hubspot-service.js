import { HubspotAdapter } from './hubspot-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { getRuntimeConfig } from '@/helpers/runtime-config'

export class HubspotService extends BaseService {
  #basePath = '/hubspot/events'

  // Resolved at call time: the exported singleton is constructed during the
  // static import graph, before loadRuntimeConfig() resolves.
  #buildUrl() {
    const baseUrl =
      getRuntimeConfig().hubspotApiUrl ||
      import.meta.env.VITE_HUBSPOT_API_URL ||
      'https://www.azion.com/api'
    return { url: `${baseUrl}${this.#basePath}`, config: {} }
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
