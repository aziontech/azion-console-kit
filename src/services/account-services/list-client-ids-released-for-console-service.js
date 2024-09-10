import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { getEnvironment } from '@/helpers/get-environment'

export const listClientIdsReleasedForConsoleService = async () => {
  const httpResponse = await AxiosHttpClientAdapter.request({
    url: `/allowed-accounts`,
    method: 'GET'
  })
  return adapt(httpResponse)
}

const adapt = (httpResponse) => {
  const environment = getEnvironment()
  const clientIds = httpResponse?.body?.[environment]?.client_ids

  return clientIds ?? []
}
