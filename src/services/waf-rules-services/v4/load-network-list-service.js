import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../../network-lists-services/v4/make-network-list-service'

export const loadNetworkListService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, id)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const element = httpResponse.body?.results

  const disabledIP = element.type === 'ip_cidr'
  const disabledCountries = element.type === 'countries'
  const networkList = {
    value: {
      id: element.id,
      disabledIP,
      disabledCountries
    },
    name: element.name
  }

  return {
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
