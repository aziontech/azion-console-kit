import { AxiosHttpClientAdapter } from '../axios/AxiosHttpClientAdapter'
import makeGithubApi from '@/services/axios/makeGithubApi'
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
    return detectFrameworkByDependencies(httpResponse)
  }

  return null
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
  const allDetectedFrameworks = dependencies.filter((dependency) => allPresets.includes(dependency))

  const hasMatchCases = allDetectedFrameworks.length > 0

  return hasMatchCases ? allDetectedFrameworks[0] : null
}
