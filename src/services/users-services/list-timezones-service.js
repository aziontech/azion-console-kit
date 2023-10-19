import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeTimezonesListBaseUrl } from './make-timezones-list-base-url'

export const listTimezonesService = async () => {
  const payload = {
    query: 'query alltimezones { allTimezones }'
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeTimezonesListBaseUrl()}/`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { statusCode, body } = httpResponse

  if (!body || !body.data?.allTimezones) {
    throw new Error('Invalid data structure in HTTP response')
  }

  const timeZonesFormatted = body.data.allTimezones
    .map((item) => {
      const matchResult = item.match(/\(UTC ([+-]\d+:\d+)\) (.+)/)

      if (!matchResult || matchResult.length < 3) {
        throw new Error('Invalid timezone data format')
      }

      const [, utc, region] = matchResult

      return {
        label: item,
        value: region,
        utc: Number(utc.replace(':', ''))
      }
    })
    .sort((timeA, timeB) => {
      if (timeA.utc !== timeB.utc) {
        return timeA.utc - timeB.utc
      } else {
        return timeA.value.localeCompare(timeB.value)
      }
    })

  const defaultSelected = timeZonesFormatted.find((item) => item.value === 'GMT').value

  return {
    body: {
      defaultSelected,
      listTimeZones: timeZonesFormatted
    },
    statusCode
  }
}
