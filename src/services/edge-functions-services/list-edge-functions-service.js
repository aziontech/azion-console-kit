import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeFunctionsBaseUrl } from './make-edge-functions-base-url'
export const listEdgeFunctionsService = async ({
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
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
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(edgeFunction.modified)
      ),
      lastModifiedDate: edgeFunction.modified,
      name: parseName(edgeFunction),
      referenceCount: edgeFunction.reference_count
    }
  })

  return {
    body: parsedEdgeFunctions,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('order_by', orderBy)
  searchParams.set('sort', sort)
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)

  return searchParams
}
