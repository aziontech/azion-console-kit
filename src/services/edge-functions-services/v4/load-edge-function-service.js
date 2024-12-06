import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'

export const loadEdgeFunctionService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { data } = httpResponse.body
  const parsedEdgeFunctions = {
    id: data.id,
    name: data.name,
    args: JSON.stringify(data.json_args, null, '\t')
  }

  return {
    body: parsedEdgeFunctions,
    statusCode: httpResponse.statusCode
  }
}
