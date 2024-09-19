import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { getEnvironment } from '@/helpers/get-environment'

export const listClientIdsReleasedForConsoleService = async (clientId) => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `/allowed-accounts`,
    method: 'GET'
  })
  return adapt(httpResponse, clientId)
}

const adapt = (httpResponse, clientId) => {
  const environment = getEnvironment()
  const env = environment === 'production' ? 'production' : 'stage'
  if (!clientId) return {}

  const client = httpResponse?.body?.[env]?.access[clientId]

  return {
    hasAccessConsole: ['global', 'restricted'].includes(client?.type),
    views: client?.views || []
  }
}
