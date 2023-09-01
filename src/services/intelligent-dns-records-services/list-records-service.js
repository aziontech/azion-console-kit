import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSBaseUrl } from './make-intelligent-dns-base-url'

export const listRecordsService = async ({ page, id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSBaseUrl()}/${id}/records?page=${page}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const isArray = Array.isArray(httpResponse.body.results?.records)

  const parsedRecords = isArray
    ? httpResponse.body.results.records.map((record) => ({
        id: record.record_id,
        name: record.entry,
        type: record.record_type,
        value: record.answers_list.join(','),
        ttl: record.ttl,
        policy: record.policy,
        description: record.description ? record.description : '-'
      }))
    : []

  return {
    body: parsedRecords,
    statusCode: httpResponse.statusCode
  }
}
