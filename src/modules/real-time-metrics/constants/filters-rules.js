const FILTER_BLACK_LIST = [
  'clientId',
  'clientIdNe',
  'clientIdLike',
  'clientIdEq',
  'clientIdIlike',
  'naxsiAttackFamilyEq',
  'naxsiAttackFamilyNe',
  'naxsiAttackFamilyLike',
  'naxsiAttackFamilyIlike'
]

const SUPPORTED_FILTER_TYPE = ['String', 'Int', 'Float', 'IntRange', 'FloatRange']
const FIELDS_LIKE = ['configurationIdIn', 'zoneIdIn', 'edgeFunctionIdIn']

const FILTER_WHITELIST = {
  SUPPORTED_FILTER_TYPE,
  FIELDS_LIKE
}

const OPERATORS = {
  Eq: { value: 'Eq', label: 'Equals', format: ({ field, value }) => `${field} = ${value}` },
  Ne: { value: 'Ne', label: 'Not Equals', format: ({ field, value }) => `${field} ≠ ${value}` },
  In: { value: 'In', label: 'In', format: ({ field, value }) => `${field} IN (${value})` },
  Like: { value: 'Like', label: 'Contains', format: ({ field, value }) => `${field} ⊃ ${value}` },
  Ilike: {
    value: 'Ilike',
    label: 'Not Contains',
    format: ({ field, value }) => `${field} ⊅ ${value}`
  },
  Range: {
    value: 'Range',
    label: 'Between',
    format: ({ field, begin, end }) => `${begin} ≤ ${field} ≤ ${end}`
  },
  Lt: { value: 'Lt', label: 'Less Than', format: ({ field, value }) => `${field} < ${value}` },
  Lte: {
    value: 'Lte',
    label: 'Less Than or Equal',
    format: ({ field, value }) => `${field} ≤ ${value}`
  },
  Gt: { value: 'Gt', label: 'Greater Than', format: ({ field, value }) => `${field} > ${value}` },
  Gte: {
    value: 'Gte',
    label: 'Greater Than or Equal',
    format: ({ field, value }) => `${field} ≥ ${value}`
  }
}

const MOST_RELEVANT_FIELDS = {
  httpMetrics: ['Domain', 'Status', 'Upstream Status', 'Upstream Cache Status', 'Request Time'],
  l2CacheMetrics: [
    'Upstream Bytes Received',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  edgeFunctionsMetrics: [
    'Domain',
    'Edge Function Id',
    'Compute Time',
    'Invocations',
    'Edge Functions Instance Id List'
  ],
  imagesProcessedMetrics: [
    'Domain',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
  dataStreamedMetrics: ['Domain', 'Status', 'Data Streamed', 'Endpoint Type', 'Requests']
}

const FILTERS_RULES = {
  FILTER_BLACK_LIST,
  FILTER_WHITELIST,
  OPERATORS,
  MOST_RELEVANT_FIELDS
}

export default FILTERS_RULES
