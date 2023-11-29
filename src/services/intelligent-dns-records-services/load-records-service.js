import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeIntelligentDNSRecordsBaseUrl } from './make-intelligent-dns-records-base-url'

export const loadRecordsService = async ({ id, intelligentDNSId }) => {
  const recordId = id
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeIntelligentDNSRecordsBaseUrl()}/${intelligentDNSId}/records?id=${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse, recordId)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse, recordId) => {
  const record = httpResponse.body.results.records.find(
    (record) => record.record_id === Number(recordId)
  )
  const parsedRecord = {
    id: record.record_id,
    name: record.entry,
    selectedRecordType: record.record_type,
    value: record.answers_list.join(','),
    ttl: record.ttl,
    selectedPolicy: record.policy,
    weight: record.weight,
    description: record.description
  }

  return {
    body: parsedRecord,
    statusCode: httpResponse.statusCode
  }
}
