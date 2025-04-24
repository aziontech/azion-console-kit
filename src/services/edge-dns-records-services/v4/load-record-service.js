import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeEdgeDNSRecordsBaseUrl } from './make-edge-dns-records-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadRecordsService = async ({ id, edgeDNSId }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeEdgeDNSRecordsBaseUrl()}/${edgeDNSId}/records/${id}`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) {
    throw new Error(extractApiError({ body: httpResponse.body })).message
  }

  const record = httpResponse.body.data

  const parsedRecord = {
    id: record.id,
    name: record.entry,
    selectedRecordType: record.record_type,
    value: record.answers_list.join('\n'),
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
