import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'

export const listPersonalTokens = async ({ page = 1, search = '' }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}?${makeSearchParams({ page, search })}`,
    method: 'GET'
  })

  httpResponse = await adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = async (httpResponse) => {
  const parsedData = httpResponse.body.results.map((item) => {
    return {
      id: item.uuid,
      scope: 'Global',
      name: item.name,
      created: item.created,
      expiresAt: item.expires_at
    }
  })

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ page, search }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page)
  searchParams.set('search', search)

  return searchParams
}
