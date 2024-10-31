import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWorkloadsBaseUrl } from './makeWorkloadsBaseUrl'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'
import { convertArrayObjectsToCamelCase } from '@/helpers/convert-array-objects-to-camel-case'

export const listWorkloadsService = async ({
  fields = '',
  ordering = 'name',
  page = 1,
  pageSize = 200
}) => {
  const searchParams = makeListServiceQueryParams({ fields, ordering, page, pageSize })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWorkloadsBaseUrl()}?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode === 200) {
    const results = httpResponse.body.results || []

    const parsedResults = convertArrayObjectsToCamelCase(results)

    return {
      body: { results: parsedResults, count: httpResponse.body.count },
      statusCode: httpResponse.statusCode
    }
  } else {
    const errorMessage = httpResponse.body.detail
    throw new Error(errorMessage).message
  }
}
