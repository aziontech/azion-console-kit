import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeMarketplaceBaseUrl } from './make-marketplace-base-url'

export const loadSolutionService = async ({ vendor, solution }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeMarketplaceBaseUrl()}/solution/${vendor}/${solution}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)
  return parseHttpResponse(httpResponse)
}
const removeStyleAttributes = (html) => {
  return html?.replace(/style="[^"]*"/g, '')
}

const adapt = (httpResponse) => {
  const solution = httpResponse.body || {}

  const parsedServices = {
    id: solution.id,
    name: solution.name,
    referenceId: solution.solution_reference_id,
    vendor: solution.vendor,
    headline: solution.headline,
    version: solution.version,
    latestVersion: solution.latest_version,
    latestVersionChangelog: solution.latest_version_changelog,
    lastUpdate: solution.updated_at,
    usage: removeStyleAttributes(solution.usage),
    overview: removeStyleAttributes(solution.overview),
    support: removeStyleAttributes(solution.support),
    isBringYourOwnLicense: solution.is_bring_your_own_license,
    isPayAsYouGo: solution.is_pay_as_you_go,
    isLaunched: solution.is_launched,
    isUpdated: solution.is_updated,
    newLaunchFlow: solution.new_launch_flow,
    slug: solution.slug,
    latestVersionInstallTemplate: solution.latest_version_install_template,
    permission: solution.permission
  }

  return {
    body: parsedServices,
    statusCode: httpResponse.statusCode
  }
}
