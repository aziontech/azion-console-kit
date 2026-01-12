import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makePersonalTokensBaseUrl } from './make-personal-tokens-base-url'
import { sortDate } from '@/utils/date-sort'
import { convertToRelativeTime, formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const listPersonalTokens = async ({ page = 1, pageSize = 200, search = '' }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePersonalTokensBaseUrl()}?${makeSearchParams({ page, pageSize, search })}`,
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
      description: item.description || '',
      lastModified: formatDateToDayMonthYearHour(creationDate),
      lastModify: convertToRelativeTime(creationDate),
      createdDate: creationDate,
      expiresAt: formatDateToDayMonthYearHour(expirationDate),
      expiresAtDate: expirationDate,
      scope: 'Global'
    }
  })

  return {
    count: httpResponse.body.count,
    body: sortDate(parsedData, 'createdDate'),
    statusCode: httpResponse.statusCode
  }
}

const makeSearchParams = ({ page, pageSize, search }) => {
  const searchParams = new URLSearchParams()
  searchParams.set('page', page)
  searchParams.set('page_size', pageSize)
  searchParams.set('search', search)
  return searchParams
}
