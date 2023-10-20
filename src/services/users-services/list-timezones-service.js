import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeTimezonesListBaseUrl } from './make-timezones-list-base-url'
import { InvalidDataStructureError } from '../axios/errors'

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
    throw new InvalidDataStructureError().message
  }

  const timeZonesFormatted = body.data.allTimezones
    .map((item) => {
      const matchResult = item.match(/\(UTC ([+-]\d+:\d+)\) (.+)/)

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
  const timeZoneDefault = 'GMT'
  const defaultSelected = timeZonesFormatted.find((item) => item.value === timeZoneDefault)?.value

  return {
    body: {
      defaultSelected,
      listTimeZones: timeZonesFormatted
    },
    statusCode
  }
}
