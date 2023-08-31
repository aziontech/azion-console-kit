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

const adapt = (httpResponse) => {
  const parsedEdgeFunctions = httpResponse.body.results?.map((edgeFunction) => {
    return {
      active: edgeFunction.active ? 'Yes' : 'No',
      version: edgeFunction.version || '-',
      language: edgeFunction.language,
      initiatorType: edgeFunction.initiator_type,
      id: edgeFunction.id,
      lastEditor: edgeFunction.last_editor,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(edgeFunction.modified)
      ),
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
