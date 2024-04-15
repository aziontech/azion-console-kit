import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makePostAdditionalDataBaseUrl } from './make-post-additional-data-base-url'

export const postAdditionalDataService = async ({ payload, options }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makePostAdditionalDataBaseUrl(payload.id)}`,
    method: 'POST',
    body: adapt(payload, options)
  })
  return parseHttpResponse(httpResponse)
}

const getOptionPayload = (options, value, otherValues = null) => {
  if (!value) return
  const selectedOption = options.find((option) => option.value === value)

  if (!selectedOption) {
    return {
      value,
      other_values: otherValues
    }
  }

  return {
    id: selectedOption.id,
    value: selectedOption.value,
    other_values: otherValues
  }
}

const adapt = (payload, options) => {
  return [
    getOptionPayload(options[0].values, payload.plan),
    getOptionPayload(options[1].values, payload.role, payload.roleDescription),
    getOptionPayload(options[2].values, payload.companySize),
    getOptionPayload(options[4].values, payload.companyWebsite),
    getOptionPayload(options[5].values, payload.onboardingSession ? 'Yes' : 'No')
  ].filter((item) => item)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {String} The result message based on the status code.
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
