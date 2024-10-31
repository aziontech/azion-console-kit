import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-function-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listFunctionsService = async ({
  id,
  ordering = 'id',
  page = 1,
  pageSize = 10,
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
      edgeFunctionId: edgeApplicationFunction.edge_function,
      name: parseName(edgeApplicationFunction),
      args: edgeApplicationFunction.json_args
    }
  })

  const count = httpResponse.body.count

  return {
    count,
    body: parsedFunctions,
    statusCode: httpResponse.statusCode
  }
}

const parseName = (edgeFunctionData) => {
  const nameProps = { text: edgeFunctionData.name, tagProps: {} }

  if (edgeFunctionData?.version && edgeFunctionData?.vendor) {
    nameProps.tagProps = {
      icon: 'pi pi-cart-plus',
      value: 'Integration',
      outlined: true,
      severity: 'info'
    }
  }

  return nameProps
}
