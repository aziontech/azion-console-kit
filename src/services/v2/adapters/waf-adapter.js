import {
  adaptServiceDataResponse,
  transformSnakeToCamel
} from '@/services/v2/utils/adaptServiceDataResponse'
import { defaultConditions } from '@/views/WafRules/Config'

const parseStatusData = (status) => ({
  content: status ? 'Active' : 'Inactive',
  severity: status ? 'success' : 'danger'
})

const ALL_THREATS = [
  'cross_site_scripting',
  'directory_traversal',
  'evading_tricks',
  'file_upload',
  'identified_attack',
  'remote_file_inclusion',
  'sql_injection',
  'unwanted_access'
]

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

  return threatsConfiguration.attributes.thresholds.map((item) => threatTypesMap[item.threat])
}

const transformMap = {
  id: (value) => value.id,
  active: (value) => parseStatusData(value.active),
  name: (value) => value.name,
  threatsConfiguration: (value) => parseThreatTypes(value.engine_settings)
}

const getPrefix = (condition) => {
  const prefixSpecific = condition.match.includes('specific_')
  const prefixValue = condition.match.includes('_value') ? 'value' : ''
  const prefixName = condition.match.includes('_name') ? 'name' : ''
  const prefixField = prefixValue || prefixName
  const prefix = prefixSpecific ? prefixField : ''

  return { prefix, prefixSpecific }
}

export const WafAdapter = {
  transformListWafRules(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  }, //OK
  adaptWafRulePayload(payload) {
    const camelToSnakeMap = {
      crossSiteScripting: 'cross_site_scripting',
      directoryTraversal: 'directory_traversal',
      evadingTricks: 'evading_tricks',
      fileUpload: 'file_upload',
      identifiedAttack: 'identified_attack',
      remoteFileInclusion: 'remote_file_inclusion',
      sqlInjection: 'sql_injection',
      unwantedAccess: 'unwanted_access'
    }

    const thresholds = Object.entries(camelToSnakeMap)
      .filter(([camelKey]) => payload[camelKey] === true)
      .map(([camelKey, snakeKey]) => ({
        threat: snakeKey,
        sensitivity: payload[`${camelKey}Sensitivity`] || 'medium'
      }))

    return {
      name: payload.name,
      active: payload.active,
      engine_settings: {
        attributes: {
          thresholds
        }
      }
    }
  }, //OK
  transformLoadWafRule({ data: response }) {
    const responseThresholds = response?.engine_settings?.attributes?.thresholds || []

    const inputMap = Object.fromEntries(
      responseThresholds.map(({ threat, sensitivity }) => [threat, sensitivity])
    )

    const threatsConfiguration = ALL_THREATS.reduce((acc, threat) => {
      const camel = transformSnakeToCamel(threat)
      acc[camel] = threat in inputMap
      acc[`${camel}Sensitivity`] = inputMap[threat] || 'medium'
      return acc
    }, {})

    return {
      id: response.id,
      name: response.name,
      active: response.active,
      ...threatsConfiguration
    }
  }, //OK
  adaptCreateWafRuleAllowedPayload(payload) {
    const formatConditions =
      payload.conditions?.map((condition) => {
        const { prefix } = getPrefix(condition)
        return {
          match: condition.match,
          ...(prefix && { [prefix]: condition[prefix] })
        }
      }) || []

    const payloadReturn = {
      conditions: formatConditions,
      path: payload.path,
      name: payload.name,
      rule_id: payload.ruleId,
      active: payload.status,
      operator: payload.operator ? 'regex' : 'contains'
    }
    return payloadReturn
  }, //OK - FALTA TALVEZ VERFICAR A QUESTAO DE SPECIFIC E ANY
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

    const isArray = Array.isArray(data.results)
    const parsedWafRulesAllowed = isArray
      ? data.results.map((waf) => ({
          id: waf.id,
          lastEditor: waf.last_editor,
          lastModified: new Intl.DateTimeFormat('us', { dateStyle: 'full' }).format(
            new Date(waf.last_modified)
          ),
          conditions: waf.conditions.map(
            (condition) => defaultConditions.find((match) => match.value === condition.match)?.title
          ),
          path: waf.path,
          name: waf.name,
          ruleId: waf.rule_id,
          status: parseStatusData(waf.active),
          operator: waf.operator
        }))
      : []

    return {
      count: data?.count ?? 0,
      body: parsedWafRulesAllowed
    }
  }, // OK
  transformLoadWafRuleAllowed({ data: waf }) {
    const conditions = [
      {
        match: 'any_http_header_value'
      },
      {
        match: 'any_http_header_name'
      },
      {
        match: 'specific_http_header_value',
        value: 'user-agent'
      },
      {
        match: 'specific_http_header_name',
        name: 'user-agent'
      },
      {
        match: 'any_query_string_value'
      },
      {
        match: 'any_query_string_name'
      },
      {
        match: 'specific_query_string_value',
        value: 'foo'
      },
      {
        match: 'specific_query_string_name',
        name: 'foo'
      },
      {
        match: 'body_form_field_value'
      },
      {
        match: 'body_form_field_name'
      },
      {
        match: 'specific_body_form_field_value',
        value: 'bar'
      },
      {
        match: 'specific_body_form_field_name',
        name: 'bar'
      },
      {
        match: 'any_url'
      },
      {
        match: 'specific_url',
        value: '/path'
      },
      {
        match: 'raw_body'
      },
      {
        match: 'file_extension'
      }
    ]

    waf.conditions = conditions || []

    const formatConditions = waf.conditions.map((condition) => {
      const { prefix } = getPrefix(condition)

      return {
        ...condition,
        title: defaultConditions.find((match) => match.value === condition.match)?.title,
        field: prefix ? condition[prefix] : undefined
      }
    })

    return {
      id: waf.id,
      conditions: formatConditions,
      path: waf.path,
      name: waf.name,
      ruleId: waf.rule_id,
      status: waf.active,
      operator: waf.operator === 'regex'
    }
  } // OK
}
