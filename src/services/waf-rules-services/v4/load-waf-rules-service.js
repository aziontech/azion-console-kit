import { AxiosHttpClientAdapter, parseHttpResponse } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const loadWafRulesService = async ({ id }) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${id}`,
    method: 'GET'
  })
  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}

const adapt = ({ body, statusCode }) => {
  if (statusCode !== 200) {
    throw new Error(extractApiError({ body })).message
  }

  const responseBody = body.data
  const threatsConfiguration = responseBody.threats_configuration

  const parsedWafRules = {
    id: responseBody.id,
    name: responseBody.name,
    active: responseBody.active,
    bypassAddresses: threatsConfiguration.bypass_addresses,
    crossSiteScriptingSensitivity: threatsConfiguration.cross_site_scripting_sensitivity,
    directoryTraversalSensitivity: threatsConfiguration.directory_traversal_sensitivity,
    evadingTricksSensitivity: threatsConfiguration.evading_tricks_sensitivity,
    fileUploadSensitivity: threatsConfiguration.file_upload_sensitivity,
    identifiedAttackSensitivity: threatsConfiguration.identified_attack_sensitivity,
    mode: threatsConfiguration.mode,
    remoteFileInclusionSensitivity: threatsConfiguration.remote_file_inclusion_sensitivity,
    sqlInjectionSensitivity: threatsConfiguration.sql_injection_sensitivity,
    unwantedAccessSensitivity: threatsConfiguration.unwanted_access_sensitivity,
    fileUpload: threatsConfiguration.file_upload,
    evadingTricks: threatsConfiguration.evading_tricks,
    unwantedAccess: threatsConfiguration.unwanted_access,
    identifiedAttack: threatsConfiguration.identified_attack,
    crossSiteScripting: threatsConfiguration.cross_site_scripting,
    directoryTraversal: threatsConfiguration.directory_traversal,
    remoteFileInclusion: threatsConfiguration.remote_file_inclusion,
    sqlInjection: threatsConfiguration.sql_injection
  }

  return {
    body: parsedWafRules,
    statusCode
  }
}
