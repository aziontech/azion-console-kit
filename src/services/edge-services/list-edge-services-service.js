import { AxiosHttpClientAdapter, parseHttpResponse } from "../axios/AxiosHttpClientAdapter"
import { makeEdgeServicesBaseUrl } from './make-edge-services-base-url'

export const listEdgeServicesService = async ({
  orderBy = 'id',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter
    .request({
      url: `${makeEdgeServicesBaseUrl()}?${searchParams.toString()}`,
      method: 'GET',
    })

  httpResponse = adapt(httpResponse);

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedEdgeServices = httpResponse.body.services?.map((edgeService) => {
    return {
      id: edgeService.id,
      name: edgeService.name,
      active: edgeService.active ? 'Yes' : 'No',
      lastEditor: edgeService.last_editor,
      lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(edgeService.updated_at)),
    }
  })

  return {
    body: parsedEdgeServices,
    statusCode: httpResponse.statusCode,
  }
}

const makeSearchParams = ({ orderBy, sort, page, pageSize }) => {
  const searchParams = new URLSearchParams();
  searchParams.set('order_by', orderBy);
  searchParams.set('sort', sort);
  searchParams.set('page', page);
  searchParams.set('page_size', pageSize);

  return searchParams;
}