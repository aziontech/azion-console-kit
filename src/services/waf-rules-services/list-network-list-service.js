import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../network-lists-services/v4/make-network-list-service'

export const listNetworkListService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?page_size=100`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const networkList = isArray
    ? httpResponse.body.results.map((networkList) => {
        const disabledIP = networkList.type === 'ip_cidr'
        const disabledCountries = networkList.type === 'countries'
        return {
          value: {
            id: networkList.id,
            value: networkList.value,
            disabledIP,
            disabledCountries
          },
          name: networkList.name
        }
      })
    : []

  return {
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
