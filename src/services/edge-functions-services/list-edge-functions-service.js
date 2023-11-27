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
    content: 'Javascript',
    icon: 'javascript'
  },
  lua: {
    content: 'Lua',
    icon: 'lua'
  }
}

const adapt = (httpResponse) => {
  const parsedEdgeFunctions = httpResponse.body.results?.map((edgeFunction) => {
    return {
      status: STATUS_AS_TAG[edgeFunction.active],
      version: edgeFunction.version || '-',
      language: LANGUAGE_AS_TAG[edgeFunction.language],
      initiatorType: edgeFunction.initiator_type,
      id: edgeFunction.id,
      lastEditor: edgeFunction.last_editor,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(edgeFunction.modified)
      ),
      lastModifiedDate: edgeFunction.modified,
      name: edgeFunction.name,
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
