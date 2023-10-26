import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeCountriesListBaseUrl } from './make-countries-list-base-url'
import { InvalidDataStructureError } from '../axios/errors'

export const listCountriesPhoneService = async () => {
  const payload = {
    query: 'query allCountries {allCountries { name, code2, phone } }'
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeCountriesListBaseUrl()}/`,
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

  if (!body || !body.data?.allCountries) {
    throw new InvalidDataStructureError().message
  }

  const allCountriesFormatted = body.data.allCountries
    .filter((item) => item.phone && item.code2)
    .map((item) => ({
      label: `${item.code2} (${item.name}) +${item.phone}`,
      labelFormat: `${item.code2} +${item.phone}`,
      value: `${item.code2} - ${item.phone}`
    }))

  return {
    body: allCountriesFormatted,
    statusCode
  }
}
