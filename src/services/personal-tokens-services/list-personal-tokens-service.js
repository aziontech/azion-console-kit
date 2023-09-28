import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'

export const listPersonalTokens = async ({ page = 1, search = '' }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}?&page=${page}&search=${search}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const parsedData = httpResponse.body.results.map((item) => {
    return {
      ...item,
      id: item.uuid,
      created: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(new Date(item.created)),
      expires_at: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
        new Date(item.expires_at)
      ),
      scope: 'Global'
    }
  })

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}
