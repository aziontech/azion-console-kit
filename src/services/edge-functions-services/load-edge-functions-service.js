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
    lastEditor: body.last_editor,
    referenceCount: body.reference_count,
    jsonArgs: JSON.stringify(body.json_args, null, 2),
    name: body.name,
    code: body.code,
    version: body.version || '-',
    modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(body.modified)),
    status: body.active
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
