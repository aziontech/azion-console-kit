import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listRegionsService = async () => {
  const payload = {
    query: `query all_countries_with_code {
      allRegions { name },
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
  const regionsFormated = httpResponse.body.data.allRegions.map((regionItem) => {
    const formattedItem = {
      name: regionItem.name
    }
    return formattedItem
  })

  return {
    body: regionsFormated,
    statusCode: httpResponse.statusCode
  }
}
