import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const listWafRulesService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/?page=1&page_size=100`,
    method: 'GET'
  })

  httpResponse = adapt(httpResponse)

  return parseHttpResponse(httpResponse)
}
const parseStatusData = (status) => {
  const parsedStatus = status
    ? {
        content: 'Active',
        severity: 'success'
      }
    : {
        content: 'Inactive',
        severity: 'danger'
      }

  return parsedStatus
}
const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const threatTypes = {
    file_upload: 'File upload',
    evading_tricks: 'Evading Tricks',
    unwanted_access: 'Unwanted Access',
    identified_attack: 'Identified Attack',
    cross_site_scripting: 'Cross-Site Scripting (XSS)',
    directory_traversal: 'Directory Traversal',
    remote_file_inclusion: 'Remote File Inclusions (RFI)',
    sql_injection: 'SQL Injection'
  }

  const parsedWafRules = httpResponse.body.results.map((waf) => {
    const threatTypesArray = []
    for (const key in threatTypes) {
      if (Object.hasOwnProperty.call(threatTypes, key)) {
        const threat = threatTypes[key]
        if (waf[key]) {
          threatTypesArray.push(threat)
        }
      }
    }
    const parser = {
      active: parseStatusData(waf.active),
      bypassAddresses: waf.bypass_addresses,
      crossSiteScripting: waf.cross_site_scripting,
      crossSiteScriptingSensitivity: waf.cross_site_scripting_sensitivity,
      directoryTraversal: waf.directory_traversal,
      directoryTraversalSensitivity: waf.directory_traversal_sensitivity,
      evadingTricks: waf.evading_tricks,
      evadingTricksSensitivity: waf.evading_tricks_sensitivity,
      fileUpload: waf.file_upload,
      fileUploadSensitivity: waf.file_upload_sensitivity,
      id: waf.id,
      identifiedAttack: waf.identified_attack,
      identifiedAttackSensitivity: waf.identified_attack_sensitivity,
      mode: waf.mode,
      name: waf.name,
      remoteFileInclusion: waf.remote_file_inclusion,
      remoteFileInclusionSensitivity: waf.remote_file_inclusion_sensitivity,
      sqlInjection: waf.sql_injection,
      sqlInjectionSensitivity: waf.sql_injection_sensitivity,
      unwantedAccess: waf.unwanted_access,
      unwantedAccessSensitivity: waf.unwanted_access_sensitivity,
      threatTypes: threatTypesArray
    }
    return parser
  })

  return {
    body: parsedWafRules,
    statusCode: httpResponse.statusCode
  }
}
