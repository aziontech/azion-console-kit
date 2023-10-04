import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listCitiesService = async () => {
  const payload = {
    query: `query all_countries_with_code {
      allCities { name },
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
  const citiesFormated = httpResponse.body.data.allCities.map((cityItem) => {
    const formattedItem = {
      name: cityItem.name
    }
    return formattedItem
  })

  return {
    body: citiesFormated,
    statusCode: httpResponse.statusCode
  }
}
