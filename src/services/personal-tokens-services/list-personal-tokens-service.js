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
    const [creationDate] = item.created.split('T')
    const [expirationDate] = item.expires_at.split('T')

    return {
      id: item.uuid,
      name: item.name,
      created: formatExhibitionDate(creationDate),
      expiresAt: formatExhibitionDate(expirationDate),
      scope: 'Global',
    }
  })

  return {
    body: parsedData,
    statusCode: httpResponse.statusCode
  }
}

const formatExhibitionDate = (dateString) => {
  return new Intl.DateTimeFormat('us', { dateStyle: 'full', timeZone: 'UTC' }).format(
    new Date(dateString)
  )
}
