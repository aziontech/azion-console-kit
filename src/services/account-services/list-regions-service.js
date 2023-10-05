import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listRegionsService = async (countryId) => {
  const payload = {
    query: `query all_countries_with_code {
      country(id: ${countryId}) {
        id
        name
        regionSet {
          id
          name
        }
    }
    }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeAzionCitiesBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  if (httpResponse.statusCode !== 200) return httpResponse

  const regionsFormated = httpResponse.body.data.country[0].regionSet.map((regionItem) => {
    return {
      name: regionItem.name,
      id: regionItem.id
    }
  })

  return {
    body: regionsFormated,
    statusCode: httpResponse.statusCode
  }
}
