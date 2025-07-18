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

const getPrefix = ({ match }) => {
  const prefixSpecific = match.includes('specific_')
  const suffixValue = match.includes('_value') ? 'value' : ''
  const suffixName = match.includes('_name') ? 'name' : ''
  const suffixField = suffixValue || suffixName
  const suffix = prefixSpecific ? suffixField : ''

  return { prefixSpecific, suffix }
}

export const WafAdapter = {
  transformListWafRules(data, fields) {
    return adaptServiceDataResponse(data, fields, transformMap)
  },
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
    const { name, active } = payload
    const thresholds = Object.entries(camelToSnakeMap)
      .filter(([camelKey]) => payload[camelKey] === true)
      .map(([camelKey, snakeKey]) => ({
        threat: snakeKey,
        sensitivity: payload[`${camelKey}Sensitivity`] || 'medium'
      }))

    return {
      name,
      active,
      engine_settings: {
        attributes: {
          thresholds
        }
      }
    }
  },
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
  },
  adaptCreateWafRuleAllowedPayload(payload) {
    const formatConditions =
      payload.conditions?.map((condition) => {
        const { suffix } = getPrefix(condition)
        return {
          match: condition.match,
          ...(suffix && { [suffix]: condition.field })
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
  },
  adaptCreateWafRuleAllowedTuningPayload(attack, name, path) {
    const payloadReturn = {
      rule_id: attack.ruleId,
      ...(path && { path }),
      name: name
        .split('\n')
        .filter((line) => line.trim() !== '')
        .join(' ')
        .trim()
    }

    const hasMatchValue = !!attack.matchValue
    const RULE_ID_MISSING_CONTENT_TYPE_IN_POST_BODY = 11
    const valueField = attack.matchValue === '-' ? null : attack.matchValue

    const MAP_ZONES = hasMatchValue
      ? {
          query_string: 'specific_query_string',
          request_body: 'specific_request_body',
          request_header: 'specific_request_header',
          body: 'specific_request_body',
          file_name: 'file_extension',
          raw_body: 'raw_body',
          cookie: 'specific_request_header'
        }
      : {
          query_string: 'any_query_string',
          request_body: 'any_request_body',
          request_header: 'any_request_header',
          body: 'any_request_body',
          file_name: 'file_extension',
          raw_body: 'raw_body',
          cookie: 'any_request_header'
        }

    if (attack.ruleId === RULE_ID_MISSING_CONTENT_TYPE_IN_POST_BODY) {
      return {
        ...payloadReturn,
        conditions: [{ match: 'any_request_body' }]
      }
    }

    const match = MAP_ZONES[attack.matchZone] || 'specific_request_header'
    const suffix = hasMatchValue ? `_${attack.matchesOn}` : ''

    return {
      ...payloadReturn,
      conditions: [
        {
          match: `${match}${suffix}`,
          ...(hasMatchValue && {
            [attack.matchesOn]: attack.matchZone === 'cookie' ? attack.matchZone : valueField
          })
        }
      ]
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
  },
  transformLoadWafRuleAllowed({ data: waf }) {
    const formatConditions = waf.conditions.map((condition) => {
      const { suffix } = getPrefix(condition)

      return {
        ...condition,
        title: defaultConditions.find((match) => match.value === condition.match)?.title,
        field: suffix ? condition[suffix] : undefined
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
  }
}
