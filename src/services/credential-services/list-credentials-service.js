import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeCredentialsBaseUrl } from './make-credentials-base-url'

export const listCredentialsService = async ({
  orderBy = 'name',
  sort = 'asc',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeSearchParams({ orderBy, sort, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeCredentialsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const results = httpResponse.body?.credentials || []

  const parsedDomains = results.map((item) => ({
    id: item.id,
    name: item.name,
    token: item.token,
    status: item.status
      ? {
          content: 'Active',
          severity: 'success'
        }
      : {
          content: 'Inactive',
          severity: 'danger'
        },
    description: item.description,
    lastEditor: item.last_editor,
    lastModified: new Intl.DateTimeFormat('us', {
      dateStyle: 'full',
      timeStyle: 'short'
    }).format(new Date(item.last_modified)),
    lastModifiedDate: item.last_modified
  }))

  return {
    body: parsedDomains,
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
