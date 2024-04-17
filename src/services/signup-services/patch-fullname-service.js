import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makePatchFullnameServiceBaseUrl } from './make-patch-fullname-service-base-url'

export const patchFullnameService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makePatchFullnameServiceBaseUrl(payload.id),
    method: 'PATCH',
    body: getNameInfo(payload.name)
  })
  return parseHttpResponse(httpResponse)
}

const getNameInfo = (fullName) => {
  const [first_name, ...last_name] = fullName.split(' ')
  const nameInfo = { first_name }

  if (last_name.length) {
    nameInfo.last_name = last_name.join(' ')
  }

  return nameInfo
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return null
    case 400:
      throw new Errors.InvalidApiRequestError().message
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
