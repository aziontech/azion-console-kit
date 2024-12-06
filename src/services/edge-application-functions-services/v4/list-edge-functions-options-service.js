import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-function-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listFunctionsServiceOptions = async ({
  id,
  ordering = 'name',
  page = 1,
  pageSize = 100,
  search = '',
  fields = ''
}) => {
  const searchParams = makeListServiceQueryParams({ ordering, page, pageSize, search, fields })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${id}/functions?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const bodyResults = httpResponse.body.results

  const parsedFunctions = bodyResults?.map((edgeApplicationFunction) => {
    return {
      id: edgeApplicationFunction.id.toString(),
      name: edgeApplicationFunction.name
    }
  })

  const count = httpResponse.body.count

  return {
    count,
    body: parsedFunctions,
    statusCode: httpResponse.statusCode
  }
}
