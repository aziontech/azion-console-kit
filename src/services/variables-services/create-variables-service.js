import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeVariablesBaseUrl } from './make-variables-base-url'

export const createVariablesService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeVariablesBaseUrl()}`,
    method: 'POST',
    body: payload
  })

  return parseHttpResponse(httpResponse)
}

/**
 * @param {Object} httpResponse
 * @param {Object} httpResponse.body
 * @param {String} httpResponse.statuscode
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 201:
      return 'Your variable has been created'
    case 400:
      const alreadyUsedKeyError = httpResponse.body['non_field_errors']?.at(0)
      const invalidKeyCharacterError = httpResponse.body['key']?.at(0)
      const invalidValueCharacterError = httpResponse.body['value']?.at(0)
      throw new Error(alreadyUsedKeyError || invalidKeyCharacterError || invalidValueCharacterError)
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
