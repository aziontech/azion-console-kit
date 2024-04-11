import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import { makeScriptRunnerBaseUrl } from './make-script-runner-base-url'
import { getEnvironment } from '@/helpers'
import * as Errors from '@/services/axios/errors'

export const createScriptRunnerExecutionService = async (payload) => {
  const bodyRequest = adapt(payload)

  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeScriptRunnerBaseUrl()}/executions/`,
    method: 'POST',
    body: bodyRequest
  })

  return parseHttpResponse(httpResponse)
}

const parseVariables = (variables) => {
  const parsedVariables = variables?.map((variable) => {
    return {
      key: variable.key,
      value: variable.value,
      store: true
    }
  })

  return parsedVariables ?? []
}

const parseFormData = (formValues) => {
  const environment = getEnvironment()

  return [
    {
      key: 'REPOSITORY_URL',
      value: formValues.repository,
      store: true
    },
    {
      key: 'ENVIRONMENT',
      value: environment,
      store: true
    },
    {
      key: 'APPLICATION_NAME',
      value: formValues.edgeApplicationName,
      store: true
    },
    {
      key: 'INSTALL_COMMAND',
      value: formValues.installCommand,
      store: true
    },
    {
      key: 'WORK_DIR',
      value: formValues.rootDirectory,
      store: true
    },
    {
      key: 'FRAMEWORK',
      value: formValues.preset,
      store: true
    }
  ]
}

const adapt = (payload) => {
  const parsedVariables = parseVariables(payload.newVariables)
  const parsedFormData = parseFormData(payload)

  return {
    image: 'azionedge/runner-static-website-with-cli-stage:2.1-alpine3.16',
    envs: [...parsedVariables, ...parsedFormData]
  }
}

/**
 * @param {Object} httpResponse - The HTTP response object.
 * @param {Object} httpResponse.body - The response body.
 * @param {String} httpResponse.statusCode - The HTTP status code.
 * @returns {string} The result message based on the status code.
 * @throws {Error} If there is an error with the response.
 */
const parseHttpResponse = (httpResponse) => {
  switch (httpResponse.statusCode) {
    case 202:
      return {
        feedback: 'Your GitHub repository has been imported successfully, and the deployment is starting.',
        urlToEditView: `/create/deploy/${httpResponse.body.uuid}`
      }
    case 400:
      const apiError = httpResponse.body.results[0]
      throw new Error(apiError).message
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