import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadEdgeFunctionService = async ({ id }) => {
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
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const { data } = httpResponse.body
  const parsedFunction = {
    id: data.id,
    active: data.active,
    language: data.language,
    initiatorType: data.initiator_type,
    lastEditor: data.last_editor,
    referenceCount: data.reference_count,
    args: JSON.stringify(data.json_args, null, 2),
    name: data.name,
    code: data.code,
    version: data.version || '-',
    modified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
      new Date(data.last_modified)
    ),
    statusTag: STATUS_AS_TAG[data.active],
    languageIcon: LANGUAGE_WITH_ICON[data.language],
    isProprietaryCode: data.is_proprietary_code || false
  }

  return {
    body: parsedFunction,
    statusCode: httpResponse.statusCode
  }
}
