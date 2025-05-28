export const WafAdapter = {
  transformListWafRules(data) {
    const parseStatusData = (status) => ({
      content: status ? 'Active' : 'Inactive',
      severity: status ? 'success' : 'danger'
    })

    const parseThreatTypes = (threatsConfiguration) => {
      const threatTypesMap = {
        file_upload: 'File upload',
        evading_tricks: 'Evading Tricks',
        unwanted_access: 'Unwanted Access',
        identified_attack: 'Identified Attack',
        cross_site_scripting: 'Cross-Site Scripting (XSS)',
        directory_traversal: 'Directory Traversal',
        remote_file_inclusion: 'Remote File Inclusions (RFI)',
        sql_injection: 'SQL Injection'
      }

      return Object.keys(threatTypesMap)
        .filter((key) => threatsConfiguration[key])
        .map((key) => threatTypesMap[key])
    }

    const mapWafRule = (waf) => ({
      id: waf.id,
      name: waf.name,
      active: parseStatusData(waf.active),
      threatsConfiguration: parseThreatTypes(waf.threats_configuration)
    })

    const parsedWafRules = Array.isArray(data.results) ? data.results.map(mapWafRule) : []

    return {
      count: data?.count ?? 0,
      body: parsedWafRules
    }
  },
  adaptWafRulePayload({ payload, isEdit = false } = {}) {
    const threatsConfiguration = {
      bypass_addresses: payload.bypassAddresses,
      cross_site_scripting_sensitivity: payload.crossSiteScriptingSensitivity,
      directory_traversal_sensitivity: payload.directoryTraversalSensitivity,
      evading_tricks_sensitivity: payload.evadingTricksSensitivity,
      file_upload_sensitivity: payload.fileUploadSensitivity,
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

    if (isEdit) {
      threatsConfiguration.account_id = payload.id
    }

    return {
      name: payload.name,
      active: payload.active,
      threats_configuration: threatsConfiguration
    }
  },

  transformLoadWafRule(response) {
    const responseBody = response.data
    const threatsConfiguration = responseBody.threats_configuration

    return {
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
  },
  adaptCloneWafRulePayload(payload, wafRulesName) {
    return {
      id: payload.id,
      name: wafRulesName
    }
  }
}
