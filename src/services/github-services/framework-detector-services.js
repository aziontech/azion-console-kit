import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeGithubApi from '@/services/axios/makeGithubApi'
import * as Errors from '@/services/axios/errors'
import { Buffer } from 'buffer'
import { getVulcanPresets } from '@/helpers'

/**
 * Detects the framework used in a given GitHub repository.
 *
 * @param {Object} params - The parameters for the function.
 * @param {string} params.accountName - The name of the GitHub account.
 * @param {string} params.repositoryName - The name of the GitHub repository.
 * @return {Promise<Object>} A promise that resolves to an object containing the parsed HTTP response.
 */
export const frameworkDetectorService = async ({ accountName, repositoryName }) => {
  const githubApiConfig = makeGithubApi()
  let httpResponse = await AxiosHttpClientAdapter.request(
    {
      url: `/repos/${accountName}/${repositoryName}/contents/package.json`,
      method: 'GET'
    },
    githubApiConfig
  )

  if (httpResponse.body?.content) {
    httpResponse = adapt(httpResponse)
  }

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const framework = detectFrameworkByDependencies(httpResponse)

  return {
    body: framework,
    statusCode: httpResponse.statusCode
  }
}

const convertPackageToJsonFormat = (httpResponse) => {
  const repositoryData = httpResponse.body
  const packageJsonData = Buffer.from(repositoryData.content, 'base64').toString('ascii')

  return JSON.parse(packageJsonData)
}

const detectFrameworkByDependencies = (httpResponse) => {
  const packageSchema = convertPackageToJsonFormat(httpResponse)
  const dependencies = Object.keys(packageSchema?.dependencies || {})

  const allPresets = getVulcanPresets()
  const allDetectedFrameworks = dependencies
    .map((dependency) => (dependency === 'next' ? 'nextjs' : dependency))
    .filter((dependency) => allPresets.includes(dependency))

  const hasMatchCases = allDetectedFrameworks.length > 0

  return hasMatchCases ? allDetectedFrameworks[0] : null
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
    case 200:
      return httpResponse.body
    case 401:
      throw new Errors.InvalidApiTokenError().message
    case 403:
      throw new Errors.PermissionError().message
    case 404:
      const apiError = 'This repository has no package.json, please try another one.'
      throw new Error(apiError).message
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Errors.UnexpectedError().message
  }
}
