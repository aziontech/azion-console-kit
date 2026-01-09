import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEventsListBaseUrl } from './make-events-list-service'
import graphQLApi from '../axios/makeEventsApi'
import { formatDateToDayMonthYearHour } from '@/helpers/convert-date'

export const listRealTimePurgeService = async (
  apiClient = graphQLApi(import.meta.env.VITE_PERSONAL_TOKEN)
) => {
  const offSetEnd = new Date()
  const offSetStart = new Date(
    Date.UTC(offSetEnd.getFullYear(), offSetEnd.getMonth(), offSetEnd.getDate() - 30)
  )

  const payload = {
    operatioName: 'ActivityHistory',
    query: `query ActivityHistory { activityHistoryEvents( offset: 0 limit: 1000, filter: { tsRange: {begin:"${offSetStart.toISOString()}", end:"${offSetEnd.toISOString()}"} resourceTypeIn: ["Purge:cachekey", "Purge:url", "Purge:wildcard", "Purge:l2cachekey"] }, orderBy: [ts_DESC] ) { resourceType
      ts
      title
      comment
      type
      requestData
      authorName
      authorEmail
      accountId } } `
  }
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeEventsListBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    apiClient
  )

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const MAPLAYER = {
  cache: 'Cache',
  tiered_cache: 'Tiered Cache'
}

const MAPTYPE = {
  cachekey: 'CacheKey',
  wildcard: 'Wildcard',
  url: 'URL'
}

const parseEscapedJSON = (escapedString) => {
  let unescapedString = escapedString
  let parsedData = null
  let hasChanged

  do {
    hasChanged = false
    try {
      parsedData = JSON.parse(unescapedString)

      if (typeof parsedData === 'string') {
        unescapedString = parsedData
        hasChanged = true
      }
    } catch (error) {
      const newUnescapedString = unescapedString.replace(/\\"/g, '"')

      if (newUnescapedString !== unescapedString) {
        unescapedString = newUnescapedString
        hasChanged = true
      } else {
        return null
      }
    }
  } while (hasChanged)

  return parsedData
}

const adapt = (httpResponse) => {
  const DEFAULT_VALUE = '-'

  const requestData = httpResponse.body.data?.activityHistoryEvents.map((item, index) => {
    const id = `${item.ts}-${index}`
    const [, type] = item.resourceType.split(':')

    const data = (() => {
      if (item?.requestData && item?.requestData !== DEFAULT_VALUE) {
        return parseEscapedJSON(item.requestData)
      }
      return null
    })()

    return {
      id,
      type: MAPTYPE[type],
      arguments: data?.items ? data.items : DEFAULT_VALUE,
      layer: data?.layer ? MAPLAYER[data.layer] : DEFAULT_VALUE,
      user: item.authorEmail,
      disabled: !data,
      time: formatDateToDayMonthYearHour(item.ts),
      ts: item.ts
    }
  })
  return {
    body: requestData,
    statusCode: httpResponse.statusCode
  }
}
