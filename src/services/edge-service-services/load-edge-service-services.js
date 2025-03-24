import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeServiceBaseUrl } from './make-edge-service-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

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
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const { id, name, active, variables } = httpResponse.body
  const parsedBody = {
    id,
    name,
    active,
    code: convertVariablesToString(variables)
  }

  return {
    body: parsedBody,
    statusCode: httpResponse.statusCode
  }
}
