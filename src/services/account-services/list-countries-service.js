import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listCountriesService = async () => {
  const payload = {
    query: `query all_countries_with_code {
      allCountries { name },
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
  const countriesFormated = httpResponse.body.data.allCountries.map((countryItem) => {
    const formattedItem = {
      name: countryItem.name
    }
    return formattedItem
  })

  return {
    body: countriesFormated,
    statusCode: httpResponse.statusCode
  }
}
