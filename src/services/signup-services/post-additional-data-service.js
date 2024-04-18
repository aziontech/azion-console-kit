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

  const optionPayload = { value: selectedOption.id }

  if (otherValues) {
    optionPayload.other_values = otherValues
  }

  return optionPayload
}

const adapt = (payload, options) => {
  options[4].values[0].value = payload.companyWebsite

  return [
    getOptionPayload(options[0].values, payload.use),
    getOptionPayload(options[1].values, payload.role, payload.inputRole),
    getOptionPayload(options[2].values, payload.companySize),
    getOptionPayload(options[4].values, payload.companyWebsite, payload.companyWebsite),
    getOptionPayload(options[5].values, payload.onboardingSession ? 'Yes' : 'No')
  ].filter((item) => item)
}

const getFieldNameOnError = (errorList) => {
  const errorMap = {
    'How are you planning to use Azion?': 'use',
    'What best describes your role?': 'role',
    'How big is your company?': 'companySize',
    'Company website?': 'website',
    'Do you want to schedule a onboarding session with an Azion expert?': 'onboardingSchedule'
  }

  let field

  Object.keys(errorMap).forEach((key) => {
    if (errorList[0].message.includes(key)) {
      field = errorMap[key]
    }
  })

  return field
}

const parseErrors = (statusCode, errors) => {
  let fieldName = null

  if (errors) {
    fieldName = getFieldNameOnError(errors)
  }

  const errorMap = {
    400: {
      errorMessage: 'User already has additional data',
      errorType: 'field',
      fieldName
    },
    403: {
      errorMessage: new Errors.PermissionError().message,
      errorType: 'api',
      fieldName
    },
    404: {
      errorMessage: new Errors.NotFoundError().message,
      errorType: 'api',
      fieldName
    },
    500: {
      errorMessage: new Errors.InternalServerError().message,
      errorType: 'api',
      fieldName
    }
  }

  const defaultError = {
    errorMessage: new Errors.UnexpectedError().message,
    errorType: 'api',
    fieldName
  }

  return JSON.stringify(errorMap[statusCode] || defaultError)
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
    case 201:
      return null
    case 400:
      throw new Error(parseErrors(httpResponse.statusCode, httpResponse.body[0].detail)).message
    case 403:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    case 404:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    case 500:
      throw new Error(parseErrors(httpResponse.statusCode)).message
    default:
      throw new Error(parseErrors(httpResponse.statusCode)).message
  }
}
