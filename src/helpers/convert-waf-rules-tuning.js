const conditionsMap = {
  'HEADER|NAME': 'any_http_header_name',
  HEADER: 'any_http_header_value',
  'ARGS|NAME': 'any_query_string_name',
  ARGS: 'any_query_string_value',
  URL: 'any_url',
  'BODY|NAME': 'body_form_field_name',
  BODY: 'body_form_field_value',
  FILE_EXT: 'file_extension',
  RAW_BODY: 'raw_body'
}

const conditionsMapDescription = {
  'HEADER|NAME': 'specific_http_header_name',
  HEADER: 'specific_http_header_value',
  'ARGS|NAME': 'specific_query_string_name',
  ARGS: 'specific_query_string_value',
  URL: 'any_url',
  'BODY|NAME': 'specific_body_form_field_name',
  BODY: 'specific_body_form_field_value',
  FILE_EXT: 'file_extension',
  RAW_BODY: 'raw_body'
}

const wafRulesMap = {
  1: 'Validation of protocol compliance: weird request, unable to parse',
  2: 'Request too big, stored on disk and not parsed',
  10: 'Validation of protocol compliance: invalid HEX encoding (null bytes)',
  11: 'Validation of protocol compliance: missing or unknown Content-Type header in a POST (this rule applies only to Request Body match zone)',
  12: 'Validation of protocol compliance: invalid formatted URL',
  13: 'Validation of protocol compliance: invalid POST format',
  14: 'Validation of protocol compliance: invalid POST boundary',
  15: 'Validation of protocol compliance: invalid JSON',
  16: 'Validation of protocol compliance: POST with no body',
  17: 'Possible SQL Injection attack: validation with libinjection_sql',
  18: 'Possible XSS attack: validation with libinjection_xss',
  1000: 'Possible SQL Injection attack: SQL keywords found in Body, Path, Query String or Cookies',
  1001: 'Possible SQL Injection or XSS attack: double quote (") found in Body, Path, Query String or Cookies',
  1002: 'Possible SQL Injection attack: possible hex encoding (0x) found in Body, Path, Query String or Cookies',
  1003: 'Possible SQL Injection attack: MySQL comment (/*) found in Body, Path, Query String or Cookies',
  1004: 'Possible SQL Injection attack: MySQL comment (*/) found in Body, Path, Query String or Cookies',
  1005: 'Possible SQL Injection attack: MySQL keyword (|) found in Body, Path, Query String or Cookies',
  1006: 'Possible SQL Injection attack: MySQL keyword (&&) found in Body, Path, Query String or Cookies',
  1007: 'Possible SQL Injection attack: MySQL comment (--) found in Body, Path, Query String or Cookies',
  1008: 'Possible SQL Injection or XSS attack: semicolon (;) found in Body, Path or Query String',
  1009: 'Possible SQL Injection attack: equal sign (=) found in Body or Query String',
  1010: 'Possible SQL Injection or XSS attack: open parenthesis [(] found in Body, Path, Query String or Cookies',
  1011: 'Possible SQL Injection or XSS attack: close parenthesis [)] found in Body, Path, Query String or Cookies',
  1013: "Possible SQL Injection or XSS attack: apostrophe (') found in Body, Path, Query String or Cookies",
  1015: 'Possible SQL Injection attack: comma (,) found in Body, Path, Query String or Cookies',
  1016: 'Possible SQL Injection attack: MySQL comment (#) found in Body, Path, Query String or Cookies',
  1017: 'Possible SQL Injection attack: double at sign (@@) found in Body, Path, Query String or Cookies',
  1100: 'Possible RFI attack: scheme "http://" found in Body, Query String or Cookies',
  1101: 'Possible RFI attack: scheme "https://" found in Body, Query String or Cookies',
  1102: 'Possible RFI attack: scheme "ftp://" found in Body, Query String or Cookies',
  1103: 'Possible RFI attack: scheme "php://" found in Body, Query String or Cookies',
  1104: 'Possible RFI attack: scheme "sftp://" found in Body, Query String or Cookies',
  1105: 'Possible RFI attack: scheme "zlib://" found in Body, Query String or Cookies',
  1106: 'Possible RFI attack: scheme "data://" found in Body, Query String or Cookies',
  1107: 'Possible RFI attack: scheme "glob://" found in Body, Query String or Cookies',
  1108: 'Possible RFI attack: scheme "phar://" found in Body, Query String or Cookies',
  1109: 'Possible RFI attack: scheme "file://" found in Body, Query String or Cookies',
  1110: 'Possible RFI attack: scheme "gopher://" found in Body, Query String or Cookies',
  1200: 'Possible Directory Traversal attack: double dot (..) found in Body, Path, Query String or Cookies',
  1202: 'Possible Directory Traversal attack: obvious probe (/etc/passwd) found in Body, Path, Query String or Cookies',
  1203: 'Possible Directory Traversal attack: obvious windows path (c:\\) found in Body, Path, Query String or Cookies',
  1204: 'Possible Directory Traversal attack: obvious probe (cmd.exe) found in Body, Path, Query String or Cookies',
  1205: 'Possible Directory Traversal attack: backslash (\\) found in Body, Path, Query String or Cookies',
  1206: 'Possible Directory Traversal attack: slash (/) found in Body, Query String or Cookies',
  1302: 'Possible XSS attack: html open tag (<) found in Body, Path, Query String or Cookies',
  1303: 'Possible XSS attack: html close tag (>) found in Body, Path, Query String or Cookies',
  1310: 'Possible XSS attack: open square bracket ([) found in Body, Path, Query String or Cookies',
  1311: 'Possible XSS attack: close square bracket (]) found in Body, Path, Query String or Cookies',
  1312: 'Possible XSS attack: tilde character (~) found in Body, Path, Query String or Cookies',
  1314: 'Possible XSS attack: back quote ( `) found in Body, Path, Query String or Cookies',
  1315: 'Possible XSS attack: double encoding (%[2|3]) found in Body, Path, Query String or Cookies',
  1400: 'Possible trick to evade protection: UTF7/8 encoding (&#) found in Body, Path, Query String or Cookies',
  1401: 'Possible trick to evade protection: MS encoding (%U) found in Body, Path, Query String or Cookies',
  1500: 'Possible File Upload attempt: asp/php (.ph, .asp or .ht) found in filename in a multipart POST containing a file'
}

const transformRuleIdToDescription = (ruleId) => {
  const id = Number(ruleId)
  return `${ruleId} - ${wafRulesMap[id] ?? '-'}`
}

const parserWafWatchs = (wafWatchs, isDescription) => {
  return wafWatchs.split(',').map((part) => {
    // eslint-disable-next-line no-unused-vars
    const [index, ruleId, rest] = part.split(':')
    let condition = rest
    let matchesOn = 'value'

    if (rest.includes('|NAME')) {
      ;[condition] = rest.split('|NAME')
      condition += '|NAME'
      matchesOn = 'name'
    } else if (rest.includes(':')) {
      ;[condition] = rest.split(':', 2)
    }

    return {
      location: isDescription
        ? conditionsMapDescription[condition]
        : conditionsMap[condition] ?? 'unknown',
      matchesOn
    }
  })
}

const parseRule = (rule) => {
  const [index, ruleNumber, location, context] = rule.split(':')
  return {
    index: Number(index),
    ruleId: Number(ruleNumber),
    location,
    context
  }
}

const parseAndGroupMultipleRules = (logs, isDescription = false) => {
  const grouped = {}

  logs.forEach((entry) => {
    if (!entry.ruleId || entry.ruleId === '-') return

    entry.ruleId.split(',').forEach((ruleStr) => {
      const { ruleId, location, context } = parseRule(ruleStr)
      const key = isDescription ? `${ruleId}|${location}|${context}` : `${ruleId}|${location}`
      const pathWithoutQueryString = entry.path.split('?')?.[0]

      if (!grouped[key]) {
        grouped[key] = {
          ruleId,
          ruleIdDescription: transformRuleIdToDescription(ruleId),
          hitCount: 0,
          [`ipHitCount${[entry.ip]}`]: 0,
          [`countryHitCount${[entry.country]}`]: 0,
          [`pathHitCount${[pathWithoutQueryString]}`]: 0,
          ips: new Set(),
          countries: new Set(),
          condition: parserWafWatchs(ruleStr, isDescription)?.[0].location,
          matchValue: context,
          paths: new Set()
        }
      }

      grouped[key].hitCount += entry.count
      grouped[key][`ipHitCount${[entry.ip]}`] =
        (grouped[key][`ipHitCount${[entry.ip]}`] || 0) + entry.count
      grouped[key][`countryHitCount${[entry.country]}`] =
        (grouped[key][`countryHitCount${[entry.country]}`] || 0) + entry.count
      grouped[key][`pathHitCount${[pathWithoutQueryString]}`] =
        (grouped[key][`pathHitCount${[pathWithoutQueryString]}`] || 0) + entry.count

      grouped[key].ips.add(entry.ip)
      grouped[key].countries.add(entry.country)
      grouped[key].paths.add(entry.path)
    })
  })

  return Object.values(grouped).map((item) => {
    return {
      ...item,
      topIps: [...item.ips].slice(0, 10),
      topCountries: [...item.countries].slice(0, 10),
      topPaths: [...item.paths].slice(0, 10),
      ipHitCount: item.ipHitCount,
      countryHitCount: item.countryHitCount,
      pathHitCount: item.pathHitCount
    }
  })
}

const getTopWithHits = (items, matchingRule, prefix) => {
  if (!items) return []
  return [...items]
    .map((el) => ({
      value: el,
      hits: matchingRule?.[`${prefix}${el}`] || 0
    }))
    .sort((fisrt, second) => second.hits - fisrt.hits)
    .slice(0, 10)
    .map(({ value, hits }) => `${value} (${hits} hits)`)
}

const groupByMatchValueAndPath = (rules, tuningId) => {
  const grouped = {}

  const rulesFiltered = rules.filter((rule) => rule.ruleId === tuningId)

  rulesFiltered.forEach((rule) => {
    rule.topPaths.forEach((path) => {
      const pathWithoutQueryString = path.split('?')?.[0]
      const key = `${rule.matchValue}::${pathWithoutQueryString}`

      if (!grouped[key]) {
        grouped[key] = {
          matchValue: rule.matchValue,
          hitCount: 0,
          condition: rule.condition,
          ips: new Set(),
          countries: new Set(),
          topIps: new Set(),
          topCountries: new Set(),
          topPaths: new Set(),
          ipHitCount: rule.ipHitCount,
          countryHitCount: rule.countryHitCount,
          pathHitCount: rule.pathHitCount
        }
      }

      grouped[key].hitCount += rule.hitCount

      rule.topIps.forEach((ip) => {
        grouped[key].ips.add(ip)
        grouped[key].topIps.add(ip)
      })

      rule.topCountries.forEach((country) => {
        grouped[key].countries.add(country)
        grouped[key].topCountries.add(country)
      })

      grouped[key].topPaths.add(pathWithoutQueryString)
    })
  })

  return Object.values(grouped).map((group) => {
    const matchingRule = rulesFiltered.find((rule) => rule.matchValue === group.matchValue)

    return {
      matchValue: group.matchValue,
      condition: group.condition,
      hitCount: group.hitCount,
      ipCount: group.ips.size,
      countryCount: group.countries.size,
      topIps: getTopWithHits(group.topIps, matchingRule, 'ipHitCount'),
      topCountries: getTopWithHits(group.topCountries, matchingRule, 'countryHitCount'),
      topPaths: getTopWithHits(group.topPaths, matchingRule, 'pathHitCount')
    }
  })
}

const normalizeCondition = (str) => {
  if (!str) return ''
  return str.toLowerCase().replace(/_/g, ' ')
}

const filterRulesByAllowed = (rules, allowedRules) => {
  const activeExceptions = allowedRules.filter(
    (exception) => exception.status?.content === 'Active'
  )

  return rules.filter((rule) => {
    const normalizedRuleCondition = normalizeCondition(rule.condition)

    const existException = activeExceptions.find((exception) => {
      const exactRuleMatch = exception.ruleId === rule.ruleId

      const exactConditionMatch = exception.conditions.some((condException) => {
        const normalizedExceptionCondition = normalizeCondition(condException)
        return normalizedExceptionCondition.includes(normalizedRuleCondition)
      })

      return exactRuleMatch && exactConditionMatch
    })

    return !existException
  })
}

export { parseAndGroupMultipleRules, filterRulesByAllowed, groupByMatchValueAndPath }
