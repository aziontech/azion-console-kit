import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listCitiesService = async (regionId) => {
  const payload = {
    query: `query all_countries_with_code {
      region(id: ${regionId}) {
        id
        name
        citySet {
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

  const citiesFormated = httpResponse.body.data.region[0].citySet.map((cityItem) => {
    return {
      name: cityItem.name,
      id: cityItem.id
    }
  })

  return {
    body: citiesFormated,
    statusCode: httpResponse.statusCode
  }
}
