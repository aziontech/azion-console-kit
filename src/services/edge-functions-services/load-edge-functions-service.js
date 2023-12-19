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

const STATUS_AS_TAG = {
  true: {
    content: 'Active',
    severity: 'success'
  },
  false: {
    content: 'Inactive',
    severity: 'danger'
  }
}

const LANGUAGE_WITH_ICON = {
  javascript: {
    content: 'JavaScript',
    icon: 'javascript'
  },
  lua: {
    content: 'Lua',
    icon: 'lua'
  }
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
    statusTag: STATUS_AS_TAG[body.active],
    languageIcon: LANGUAGE_WITH_ICON[body.language],
  }

  return {
    body: parsedVariable,
    statusCode: httpResponse.statusCode
  }
}
