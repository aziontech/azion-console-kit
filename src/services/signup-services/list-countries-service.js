import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
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
      url: `${makeAzionCitiesBaseUrl()}/`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body, statusCode } = httpResponse
  const countries = body.data.allCountries.map((countryItem) => {
    return {
      name: countryItem.name,
      id: countryItem.id
    }
  })

  return {
    countries,
    statusCode
  }
}

/**
 * Parses the HTTP response and handles different status codes.
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @return {Object} The adapted response object.
 * @throws {Error} If there is an error with the response.
 */

export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return adapt(httpResponse)
    case 400:
      throw new Errors.InvalidApiRequestError().message
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      throw new Errors.NotFoundError().message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
