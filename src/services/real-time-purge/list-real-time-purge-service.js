import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeEventsListBaseUrl } from './make-events-list-service'
import graphQLApi from '../axios/makeEventsApi'
import { formatExhibitionDate } from '@/helpers/convert-date'

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
  edge_cache: 'Edge Cache',
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
  const whileTrue = true

  while (whileTrue) {
    try {
      parsedData = JSON.parse(unescapedString)

      if (typeof parsedData === 'string') {
        unescapedString = parsedData
      } else {
        break
      }
    } catch (error) {
      unescapedString = unescapedString.replace(/\\"/g, '"')

      if (unescapedString === escapedString) {
        return null
      }
      escapedString = unescapedString
    }
  }

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
      time: formatExhibitionDate(item.ts, 'full', 'short')
    }
  })
  return {
    body: requestData,
    statusCode: httpResponse.statusCode
  }
}
