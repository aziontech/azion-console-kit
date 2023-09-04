import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeCountriesListBaseUrl } from './make-countries-list-base-url'

export const listCountriesService = async () => {
  const payload = {
    query: 'query all_countries_with_code {allCountries { name, code2 } }'
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
  const countriesFormated = httpResponse.body.data.allCountries.map((countryItem) => {
    const formattedItem = {
      name: countryItem.name,
      value: countryItem.code2
    }
    return formattedItem
  })

  return {
    body: countriesFormated,
    statusCode: httpResponse.statusCode
  }
}
