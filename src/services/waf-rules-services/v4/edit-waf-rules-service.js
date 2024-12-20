import * as Errors from '@/services/axios/errors'
import { AxiosHttpClientAdapter } from '@/services/axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'
import { extractApiError } from '@/helpers/extract-api-error'

export const editWafRulesService = async (payload, id) => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/${id}`,
    method: 'PATCH',
    body: adapt(payload)
  })

  return parseHttpResponse(httpResponse)
}

const adapt = (payload) => {
  return {
    name: payload.name,
    active: payload.active,
    threats_configuration: {
      bypass_addresses: payload.bypassAddresses,
      cross_site_scripting_sensitivity: payload.crossSiteScriptingSensitivity,
      directory_traversal_sensitivity: payload.directoryTraversalSensitivity,
      evading_tricks_sensitivity: payload.evadingTricksSensitivity,
      file_upload_sensitivity: payload.fileUploadSensitivity,
      account_id: payload.id,
      identified_attack_sensitivity: payload.identifiedAttackSensitivity,
      remote_file_inclusion_sensitivity: payload.remoteFileInclusionSensitivity,
      sql_injection_sensitivity: payload.sqlInjectionSensitivity,
      unwanted_access_sensitivity: payload.unwantedAccessSensitivity,
      file_upload: payload.fileUpload,
      evading_tricks: payload.evadingTricks,
      unwanted_access: payload.unwantedAccess,
      identified_attack: payload.identifiedAttack,
      cross_site_scripting: payload.crossSiteScripting,
      directory_traversal: payload.directoryTraversal,
      remote_file_inclusion: payload.remoteFileInclusion,
      sql_injection: payload.sqlInjection
    }
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
      return 'Your waf rule has been updated'
    case 500:
      throw new Errors.InternalServerError().message
    default:
      throw new Error(extractApiError(httpResponse)).message
  }
}