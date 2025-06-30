import { adaptServiceDataResponse } from '@/services/v2/utils/adaptServiceDataResponse'

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

const transformMap = {
  id: (value) => value.id,
  active: (value) => parseStatusData(value.active),
  name: (value) => value.name,
  // threatsConfiguration: (value) => parseThreatTypes(value.threats_configuration)
}

export const WafAdapter = {
  transformListWafRules(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
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
  },
  adaptCreateWafRuleAllowedPayload(payload) {
    const matchValidationValues = payload.matchZones.map((zone) => {
      if (['path', 'file_name', 'raw_body'].includes(zone.zone)) {
        zone.matches_on = null
      }
      return zone
    })
    return {
      match_zones: matchValidationValues,
      path: payload.path,
      name: payload.name,
      rule_id: payload.ruleId,
      active: payload.status,
      use_regex: payload.useRegex
    }
  },
  adaptCreateWafRuleAllowedTuningPayload(attack, hasMatchValue, name, path) {
    const MAP_MATCH_ZONES_CONDITIONAL = {
      query_string: 'conditional_query_string',
      request_body: 'conditional_request_body',
      request_header: 'conditional_request_header',
      body: 'conditional_request_body',
      file_name: 'file_name',
      path: 'path',
      raw_body: 'raw_body',
      cookie: 'conditional_request_header'
    }

    const MAP_MATCH_ZONES = {
      query_string: 'query_string',
      request_body: 'request_body',
      request_header: 'request_header',
      body: 'request_body',
      file_name: 'file_name',
      path: 'path',
      raw_body: 'raw_body',
      cookie: 'request_header'
    }

    function checkAndReturnDefault(zone, hasMatchValue) {
      const defaultZone = 'conditional_request_header'
      const ZONES = hasMatchValue ? MAP_MATCH_ZONES_CONDITIONAL : MAP_MATCH_ZONES
      return ZONES[zone] || defaultZone
    }

    function removeEmptyLinesAndSpaces(name) {
      return name
        .split('\n')
        .filter((line) => line.trim() !== '')
        .join(' ')
        .trim()
    }

    const REQUEST_BODY_EXCEPTION_RULE_ID = 11
    let matchZones = {
      zone:
        attack.ruleId === REQUEST_BODY_EXCEPTION_RULE_ID
          ? 'request_body'
          : checkAndReturnDefault(attack.matchZone, hasMatchValue),
      matches_on: attack.matchesOn
    }

    if (hasMatchValue) {
      const isCookieZone = attack.matchZone === 'cookie'
      const zoneInputValue = attack.matchValue === '-' ? null : attack.matchValue
      matchZones.zone_input = isCookieZone ? 'cookie' : zoneInputValue
    }

    return {
      rule_id: attack.ruleId,
      match_zones: [matchZones],
      ...(path && { path }),
      name: removeEmptyLinesAndSpaces(name)
    }
  },
  transformListWafRulesAllowed(data) {
    const parseStatusData = (status) => ({
      content: status ? 'Active' : 'Inactive',
      severity: status ? 'success' : 'danger'
    })

    const replaceString = (str, value) => str.replace('$value', value)

    const parseMatchZone = (waf) => {
      const arrayMatchZone = []
      const zones = {
        query_string: 'Query String$value',
        raw_body: 'Raw Body',
        request_body: 'Request Body$value',
        request_header: 'Request Header$value',
        path: 'Path',
        file_name: 'File Name (Multipart Body)',
        conditional_request_header: 'Conditional Request Header$value',
        conditional_request_body: 'Conditional Request Body$value',
        conditional_query_string: 'Conditional Query String$value'
      }

      for (const matchZone of waf) {
        let value = zones[matchZone.zone]

        if (!value) continue

        if (matchZone.zone_input) {
          const label = matchZone.matches_on === 'name' ? 'Name' : 'Value'
          value = replaceString(value, `: ${matchZone.zone_input} (${label})`)
        } else if (matchZone.matches_on) {
          const label =
            matchZone.matches_on === 'name'
              ? ' (Name)'
              : matchZone.matches_on === 'value'
              ? ' (Value)'
              : ''
          value = replaceString(value, label)
        }

        arrayMatchZone.push(value)
      }
      return arrayMatchZone
    }
    const getRuleIdText = (ruleId) => ruleId

    const isArray = Array.isArray(data.results)
    const parsedWafRulesAllowed = isArray
      ? data.results.map((waf) => ({
          id: waf.id,
          lastEditor: waf.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(waf.last_modified)
          ),
          matchZones: parseMatchZone(waf.match_zones),
          path: waf.path,
          name: waf.name,
          ruleId: getRuleIdText(waf.rule_id),
          status: parseStatusData(waf.active),
          useRegex: waf.use_regex
        }))
      : []

    return {
      count: data?.count ?? 0,
      body: parsedWafRulesAllowed
    }
  },
  transformLoadWafRuleAllowed(data) {
    const waf = data.data || data

    return {
      matchZones: waf.match_zones,
      path: waf.path,
      name: waf.name,
      ruleId: waf.rule_id,
      status: waf.active,
      useRegex: waf.use_regex
    }
  }
}
