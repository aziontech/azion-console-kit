import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEdgeDNSRecordsBaseUrl } from './make-edge-dns-records-base-url'

export const listRecordsService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSRecordsBaseUrl()}/${id}/records?page_size=200`,
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
        value: record.answers_list,
        ttl: record.ttl,
        policy: record.policy,
        weight: record.weight,
        description: record.description ? record.description : '-'
      }))
    : []

  return {
    body: parsedRecords,
    statusCode: httpResponse.statusCode
  }
}
