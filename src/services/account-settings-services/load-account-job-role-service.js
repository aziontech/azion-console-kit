import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import * as Errors from '@/services/axios/errors'
import { makeAccountSettingsBaseUrl } from './make-account-settings-base-url'

export const loadAccountJobRoleService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: makeAccountSettingsBaseUrl(),
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const replaceLegacyJobRoles = (currentAccountJobRoleName) => {
  const defaultJobRole = 'other'
  const validJobRoles = [
    'software-developer',
    'devops-engineer',
    'infrastructure-analyst',
    'network-engineer',
    'security-specialist',
    'data-engineer',
    'ai-ml-engineer',
    'iot-engineer',
    'team-lead',
    defaultJobRole
  ]

  const isJobRoleValid = validJobRoles.some((jobName) => jobName === currentAccountJobRoleName)

  if (isJobRoleValid) {
    return currentAccountJobRoleName
  }
  return defaultJobRole
}

const adapt = (response) => {
  const payload = response.body.data
  const parsedBody = {
    jobRole: replaceLegacyJobRoles(payload.job_function)
  }

  return {
    body: parsedBody,
    statusCode: response.statusCode
  }
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
      return httpResponse.body
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
