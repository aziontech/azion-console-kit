import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'

export const loadEdgeServiceServices = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeServiceBaseUrl()}/${id}?with_vars=true`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const convertVariablesToString = (variables) => {
  return variables ? variables.map(({ name, value }) => `${name}=${value}`).join('\n') : ''
}

const adapt = (httpResponse) => {
  const { name, active, variables } = httpResponse.body
  const parsedBody = {
    name,
    active,
    code: convertVariablesToString(variables)
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
