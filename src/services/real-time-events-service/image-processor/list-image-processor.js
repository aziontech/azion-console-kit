import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'

export const listImageProcessor = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: makeRealTimeEventsBaseUrl(),
    method: 'POST',
    body: payload
  })

  return adaptResponse(response)
}

const adapt = (filter) => {
  const table = {
    dataset: 'imagesProcessedEvents',
    limit: 10000,
    fields: [
      'bytesSent',
      'configurationId',
      'host',
      'httpReferer',
      'httpUserAgent',
      'referenceError',
      'ts'
    ],
    orderBy: 'ts_ASC'
  }
  return convertGQL(filter, table)
}

const adaptResponse = (response) => {
  const { body } = response

  return body.data.imagesProcessedEvents?.map((imagesProcessedEvents) => ({
    id: generateCurrentTimestamp(),
    bytesSent: imagesProcessedEvents.bytesSent,
    configurationId: imagesProcessedEvents.configurationId,
    host: imagesProcessedEvents.host,
    httpReferer: imagesProcessedEvents.httpReferer,
    httpUserAgent: imagesProcessedEvents.httpUserAgent,
    referenceError: imagesProcessedEvents.referenceError,
    ts: imagesProcessedEvents.ts
  }))
}
