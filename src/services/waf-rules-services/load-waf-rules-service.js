import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const loadWafRulesService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/rulesets/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = (httpResponse) => {
  const parsedWafRules = {
    active: httpResponse.body.results.active,
    bypassAddresses: httpResponse.body.results.bypass_addresses,
    crossSiteScriptingSensitivity: httpResponse.body.results.cross_site_scripting_sensitivity,
    directoryTraversalSensitivity: httpResponse.body.results.directory_traversal_sensitivity,
    evadingTricksSensitivity: httpResponse.body.results.evading_tricks_sensitivity,
    fileUploadSensitivity: httpResponse.body.results.file_upload_sensitivity,
    id: httpResponse.body.results.id,
    identifiedAttackSensitivity: httpResponse.body.results.identified_attack_sensitivity,
    mode: httpResponse.body.results.mode,
    name: httpResponse.body.results.name,
    remoteFileInclusionSensitivity: httpResponse.body.results.remote_file_inclusion_sensitivity,
    sqlInjectionSensitivity: httpResponse.body.results.sql_injection_sensitivity,
    unwantedAccessSensitivity: httpResponse.body.results.unwanted_access_sensitivity,
    fileUpload: httpResponse.body.results.file_upload,
    evadingTricks: httpResponse.body.results.evading_tricks,
    unwantedAccess: httpResponse.body.results.unwanted_access,
    identifiedAttack: httpResponse.body.results.identified_attack,
    crossSiteScripting: httpResponse.body.results.cross_site_scripting,
    directoryTraversal: httpResponse.body.results.directory_traversal,
    remoteFileInclusion: httpResponse.body.results.remote_file_inclusion,
    sqlInjection: httpResponse.body.results.sql_injection
  }

  return {
    body: parsedWafRules,
    statusCode: httpResponse.statusCode
  }
}
