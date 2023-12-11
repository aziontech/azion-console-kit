import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import beholderGQL from '../axios/makeBeholderGQL'
import { makeBeholderBaseUrl } from './make-beholder-base-url'

export const fetchDataFromBeholderService = async ({ query, variables }) => {
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeBeholderBaseUrl()}`,
      method: 'POST',
      body: {
        query,
        variables
      }
    },
    beholderGQL
  )

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  return {
    body: httpResponse.body,
    statusCode: httpResponse.statusCode
  }
}
