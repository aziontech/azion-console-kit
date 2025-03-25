import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeWafRulesBaseUrl } from './make-waf-rules-base-url'

export const listWafRulesService = async () => {
  let httpResponse = await AxiosHttpClientAdapter.request({
    url: `${makeWafRulesBaseUrl()}/?page=1&page_size=2000`,
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

const parseThreatTypes = (waf) => {
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

  const threatTypesArray = []
  for (const key in threatTypes) {
    const threat = threatTypes[key]
    if (waf[key]) {
      threatTypesArray.push(threat)
    }
  }

  return threatTypesArray
}

const adapt = (httpResponse) => {
  /**
   * Necessary until the API gets the common pattern
   * of returning the array of data inside results property
   * like other andpoints.
   */

  const isArray = Array.isArray(httpResponse.body.results)

  const parsedWafRules = isArray
    ? httpResponse.body.results.map((waf) => {
        const threatTypes = parseThreatTypes(waf)
        const parser = {
          active: parseStatusData(waf.active),
          bypassAddresses: waf.bypass_addresses,
          crossSiteScriptingSensitivity: waf.cross_site_scripting_sensitivity,
          directoryTraversalSensitivity: waf.directory_traversal_sensitivity,
          evadingTricksSensitivity: waf.evading_tricks_sensitivity,
          fileUploadSensitivity: waf.file_upload_sensitivity,
          id: waf.id,
          identifiedAttackSensitivity: waf.identified_attack_sensitivity,
          mode: waf.mode,
          name: waf.name,
          remoteFileInclusionSensitivity: waf.remote_file_inclusion_sensitivity,
          sqlInjectionSensitivity: waf.sql_injection_sensitivity,
          unwantedAccessSensitivity: waf.unwanted_access_sensitivity,
          threatTypes: threatTypes
        }
        return parser
      })
    : []

  return {
    body: parsedWafRules,
    statusCode: httpResponse.statusCode
  }
}
