import { AxiosHttpClientAdapter, parseHttpResponse } from '../../axios/AxiosHttpClientAdapter'
import { makeEdgeDNSRecordsBaseUrl } from './make-edge-dns-records-base-url'
import { makeListServiceQueryParams } from '@/helpers/make-list-service-query-params'

export const listRecordsService = async ({
  search = '',
  fields = '',
  ordering = 'entry',
  page = 1,
  pageSize = 10,
  id
}) => {
  const searchParams = makeListServiceQueryParams({ ordering, fields, page, pageSize, search })
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSRecordsBaseUrl()}/${id}/records?${searchParams.toString()}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results)

  const parsedRecords = isArray
    ? httpResponse.body.results.map((record) => ({
        id: record.record_id,
        name: record.entry,
        type: record.record_type,
        value: record.answers_list,
        ttl: record.ttl,
        policy: record.policy,
        weight: record.weight,
        description: record.description ? record.description : '-'
      }))
    : []
  return {
    count: httpResponse.body.count,
    body: parsedRecords,
    statusCode: httpResponse.statusCode
  }
}
