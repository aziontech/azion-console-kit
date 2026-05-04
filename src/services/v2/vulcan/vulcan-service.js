import { VulcanAdapter } from './vulcan-adapter'
import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'
import { getCacheOptions, CACHE_TYPE } from '@/services/v2/base/query/queryOptions'

export class VulcanService extends BaseService {
  #baseURL = 'utils/presets'

  fetchPresets = async ({ signal } = {}) => {
    try {
      const response = await this.http.request({
        method: 'GET',
        url: this.#baseURL,
        config: {
          baseURL: '/api',
          ...(signal && { signal })
        }
      })

      const results = Array.isArray(response.data) ? response.data : (response.data?.results ?? [])

      return VulcanAdapter.transformPresetsList(results)
    } catch (error) {
      return VulcanAdapter.getMockPresets()
    }
  }

  listPresetsWithCache = async ({ signal } = {}) => {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.vulcan.presets(),
      queryFn: () => this.fetchPresets({ signal }),
      ...getCacheOptions(CACHE_TYPE.STATIC),
      meta: { persist: true, cacheType: CACHE_TYPE.STATIC }
    })
  }

  listPresetsService = async () => {
    const queryKey = queryKeys.vulcan.presets()

    return await this.useEnsureQueryData(queryKey, ({ signal }) => this.fetchPresets({ signal }), {
      cacheType: this.cacheType.STATIC,
      persist: true
    })
  }

  getModesByPreset = (presetName) => {
    return VulcanAdapter.getModesByPreset(presetName)
  }
}

export const vulcanService = new VulcanService()
