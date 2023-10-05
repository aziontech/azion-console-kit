import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listCountriesService = async () => {
  const payload = {
    query: `query all_countries_with_code {
      allCountries { name, id },
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

  const countriesFormated = httpResponse.body.data.allCountries.map((countryItem) => {
    return {
      name: countryItem.name,
      id: countryItem.id
    }
  })

  return {
    body: countriesFormated,
    statusCode: httpResponse.statusCode
  }
}
