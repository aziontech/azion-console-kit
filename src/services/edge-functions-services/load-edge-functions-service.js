import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'

export const loadEdgeFunctionsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const body = httpResponse.body.results
  const parsedVariable = {
    id: body.id,
    active: body.active,
    language: body.language,
    initiatorType: body.initiator_type,
    jsonArgs: JSON.stringify(body.json_args, null, 2),
    name: body.name,
    code: body.code,
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
