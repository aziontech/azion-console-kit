import convertGQL from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '../../axios/AxiosHttpClientSignalDecorator'

export const listImageProcessor = async (filter) => {
  const payload = adapt(filter)

  const decorator = new AxiosHttpClientSignalDecorator()

  const response = await decorator.request({
    url: '/events/graphql',
    method: 'POST',
    body: payload,
    headers: {
      'Content-Type': 'application/json; version=3'
    }
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
    bytesSent: imagesProcessedEvents.bytesSent,
    id: imagesProcessedEvents.configurationId,
    host: imagesProcessedEvents.host,
    httpReferer: imagesProcessedEvents.httpReferer,
    httpUserAgent: imagesProcessedEvents.httpUserAgent,
    referenceError: imagesProcessedEvents.referenceError,
    ts: imagesProcessedEvents.ts
  }))
}
