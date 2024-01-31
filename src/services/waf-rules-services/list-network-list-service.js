import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../network-lists-services/make-network-list-base-url'

export const listNetworkListService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?pagination=false&exclude_azion_lists=true`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const networkList = isArray
    ? httpResponse.body.results.map((networkList) => {
        const disabledIP = networkList.list_type === 'ip_cidr'
        const disabledCountries = networkList.list_type === 'countries'
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
