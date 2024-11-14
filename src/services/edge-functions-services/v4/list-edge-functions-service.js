import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listEdgeFunctionsService = async ({
  fields = '',
  search = '',
  ordering = '',
  page = 1,
  pageSize = 10
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeFunctionsBaseUrl()}?${searchParams.toString()}`,
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

const LANGUAGE_AS_TAG = {
  javascript: {
    content: 'JavaScript',
    icon: 'javascript'
  },
  lua: {
    content: 'Lua',
    icon: 'lua'
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

const parseLastEditor = (edgeFunctionData) => {
  return edgeFunctionData?.version && edgeFunctionData?.vendor
    ? edgeFunctionData.vendor
    : edgeFunctionData.last_editor
}

const adapt = (httpResponse) => {
  const parsedEdgeFunctions = httpResponse.body.results?.map((edgeFunction) => {
    return {
      status: STATUS_AS_TAG[edgeFunction.active],
      version: edgeFunction.version || '-',
      language: LANGUAGE_AS_TAG[edgeFunction.language],
      initiatorType: edgeFunction.initiator_type,
      id: edgeFunction.id,
      lastEditor: parseLastEditor(edgeFunction),
      name: parseName(edgeFunction),
      referenceCount: edgeFunction.reference_count
    }
  })

  return {
    count: httpResponse.body.count,
    body: parsedEdgeFunctions,
    statusCode: httpResponse.statusCode
  }
}
