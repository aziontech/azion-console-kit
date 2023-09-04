import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeVariablesBaseUrl } from './make-variables-base-url'

export const loadVariableService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVariablesBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedVariable = {
    id: httpResponse.body.uuid,
    key: httpResponse.body.key,
    value: httpResponse.body.value,
    secret: httpResponse.body.secret
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
