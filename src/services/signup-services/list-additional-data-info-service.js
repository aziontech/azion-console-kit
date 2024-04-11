import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAdditionalDataBaseUrl } from './make-additional-data-base-url'

export const listAdditionalDataInfoService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeAdditionalDataBaseUrl()}`,
    method: 'GET'
  })

  return parseHttpResponse(httpResponse)
}

const addNameFieldAtIndexThree = (response) => {
  const nameField = {
    id: 4,
    key: 'Full Name',
    required: true,
    values: []
  }

  return [...response.slice(0, 3), nameField, ...response.slice(3)]
}

const addResponseFields = (response) => {
  response = addNameFieldAtIndexThree(response)

  const fields = [
    { type: 'plan', required: true, fieldType: 'radio' },
    { type: 'role', required: true, fieldType: 'radio', show: false },
    { type: 'companySize', required: true, fieldType: 'radio', show: false },
    {
      type: 'fullName',
      required: true,
      fieldType: 'text',
      show: false,
      values: [{ id: 1, value: '' }]
    },
    {
      type: 'companyWebsite',
      required: true,
      fieldType: 'text',
      show: false,
      values: [{ id: 1, value: '' }]
    },
    {
      type: 'onboardingSession',
      required: false,
      fieldType: 'switch',
      show: false,
      values: [{ id: 1, value: true }]
    }
  ]
  return response.map((item) => {
    return {
      ...item,
      ...fields.shift()
    }
  })
}

/**
 * Parses the HTTP response and handles different status codes.
 *
 * @param {Object} httpResponse - The HTTP response object.
 * @return {Object} httpResponse.body - The response body.
 * @throws {Error} If there is an error with the response.
 */
export const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return addResponseFields(httpResponse.body.results)
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
