import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import graphQLApi from '../axios/makeGraphQl'
import * as Errors from '@/services/axios/errors'
import { makeAzionCitiesBaseUrl } from './make-azion-cities-base-url'

export const listCitiesService = async (regionId) => {
  const payload = {
    query: `query region { region(geoid: ${regionId}) { citySet { name, geonameId } } }`
  }

  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `${makeAzionCitiesBaseUrl()}`,
      method: 'POST',
      body: payload
    },
    graphQLApi
  )

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const { body } = httpResponse

  return body.data.region[0].citySet.map((cityItem) => {
    return {
      name: cityItem.name,
      geonameId: cityItem.geonameId
    }
  })
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {Object} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return adapt(httpResponse)
    case 400: {
      const { message: apiMessage } = httpResponse.body.errors[0]
      throw new Error(apiMessage).message
    }
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
