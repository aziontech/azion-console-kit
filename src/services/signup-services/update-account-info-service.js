import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeUpdateAccountInfoServiceBaseUrl } from './make-update-account-info-service-base-url'

export const updateAccountInfoService = async (payload) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeUpdateAccountInfoServiceBaseUrl(),
    method: 'PATCH',
    body: adapt(payload)
  })
  return parseHttpResponse(httpResponse)
}

/**
 * Maps the job role from the payload to a corresponding value and returns an object with the mapped value and a flag defining the first login as false.
 *
 * @param {Object} payload - The payload object containing the job function.
 * @param {string} payload.jobFunction - The job function to be mapped.
 * @return {Object} - An object with the mapped job function value and a flag of the first login.
 */
const adapt = (payload) => {
  const jobRolesMap = {
    'Software Developer': 'software-developer',
    'DevOps Engineer': 'devops-engineer',
    'Infrastructure Analyst': 'infrastructure-analyst',
    'Network Engineer': 'network-engineer',
    'Security Specialist': 'security-specialist',
    'Data Engineer': 'data-engineer',
    'AI/ML Engineer': 'ai-ml-engineer',
    'IoT Engineer': 'iot-engineer',
    'Team Lead': 'team-lead',
    Other: 'other'
  }

  return {
    job_function: jobRolesMap[payload],
    first_login: false
  }
}

const parseErrors = (statusCode) => {
  const errorMap = {
    400: {
      errorMessage: new Errors.InvalidApiRequestError().message,
      errorType: 'field',
      fieldName: 'role'
    },
    403: {
      errorMessage: new Errors.PermissionError().message,
      errorType: 'api',
      fieldName: null
    },
    404: {
      errorMessage: new Errors.NotFoundError().message,
      errorType: 'api',
      fieldName: null
    },
    500: {
      errorMessage: new Errors.InternalServerError().message,
      errorType: 'api',
      fieldName: null
    }
  }

  const defaultError = {
    errorMessage: new Errors.UnexpectedError().message,
    errorType: 'api',
    fieldName: null
  }

  return JSON.stringify(errorMap[statusCode] || defaultError)
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {null} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */

const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 200:
      return { jobRole: httpResponse.body.data.job_function }
    case 400:
      throw new Error(parseErrors(httpResponse.statusCode)).message
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
