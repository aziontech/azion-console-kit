import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeNetworkListBaseUrl } from '../../network-lists-services/v4/make-network-list-service'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listNetworkListService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeNetworkListBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const networkList = isArray
    ? httpResponse.body.results.map((element) => {
        const disabledIP = element.type === 'ip_cidr'
        const disabledCountries = element.type === 'countries'
        return {
          value: {
            id: element.id,
            disabledIP,
            disabledCountries
          },
          id: element.id,
          name: element.name
        }
      })
    : []

  const count = httpResponse.body?.count ?? 0

  return {
    count,
    body: networkList,
    statusCode: httpResponse.statusCode
  }
}
