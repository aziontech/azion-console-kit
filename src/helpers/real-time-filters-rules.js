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

const SUPPORTED_FILTER_TYPE = ['String', 'Int', 'Float', 'IntRange', 'FloatRange', 'GenericScalar']
const FIELDS_LIKE = [
  'configurationIdIn',
  'zoneIdIn',
  'edgeFunctionIdIn',
  'botCategoryIn',
  'challengeSolvedEq'
]

const ALIAS_MAPPING = {
  configurationId: 'domain'
}

const FILTER_WHITELIST = {
  SUPPORTED_FILTER_TYPE,
  FIELDS_LIKE
}

const MOST_RELEVANT_FIELDS = {
  httpMetrics: ['Domain', 'Status', 'Upstream Status', 'Upstream Cache Status', 'Request Time'],
  httpEvents: ['Domain', 'Status', 'Upstream Status', 'Upstream Cache Status', 'Request Time'],
  l2CacheMetrics: [
    'Upstream Bytes Received',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  l2CacheEvents: [
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
  edgeFunctionsEvents: [
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
  imagesProcessedEvents: [
    'Domain',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  idnsQueriesEvents: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
  idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
  dataStreamedEvents: ['Domain', 'Data Streamed', 'Endpoint Type', 'Requests', 'Configuration Id'],
  dataStreamedMetrics: ['Domain', 'Status', 'Data Streamed', 'Endpoint Type', 'Requests']
}

const FILTER_LIKE_TYPE = {
  configurationIdIn: 'ArrayObject',
  zoneIdIn: 'ArrayObject',
  edgeFunctionIdIn: 'ArrayObject',
  botCategoryIn: 'ArrayObject',
  challengeSolvedEq: 'Boolean'
}

const FILTER_LIKE_ALIAS = {
  configurationIdIn: 'Domain'
}

/**
 * Order by more relevant
 *
 * @param {array} fields - List to be sorted.
 * @return {array} Sorted list.
 */

const sortFields = (fields) => {
  const notRelevant = -1
  fields.sort((fieldA, fieldB) => {
    if (fieldA.mostRelevant === notRelevant && fieldB.mostRelevant !== notRelevant) {
      return 1
    }

    if (fieldA.mostRelevant !== notRelevant && fieldB.mostRelevant === notRelevant) {
      return -1
    }

    if (fieldA.mostRelevant !== fieldB.mostRelevant) {
      return fieldA.mostRelevant - fieldB.mostRelevant
    }

    return fieldA.label.localeCompare(fieldB.label)
  })
}

/**
 * Verify if the provided name is blacklisted.
 *
 * @param {object} name - The name to be verified.
 * @return {boolean} Whether the name is blacklisted or not.
 */
const verifyBlackListFields = ({ name }) => {
  return !FILTERS_RULES.FILTER_BLACK_LIST.includes(name)
}

/**
 * Verify if the whitelist fields are supported.
 *
 * @param {object} name - the name of the field
 * @param {object} type - the type object containing the name of the type
 * @param {string} type.name - the name of the type
 * @return {boolean} true if the field is supported, false otherwise
 */
const verifyWhiteListFields = ({ name, type: { name: typeName } }) => {
  return (
    FILTERS_RULES.FILTER_WHITELIST.SUPPORTED_FILTER_TYPE.includes(typeName) ||
    FILTERS_RULES.FILTER_WHITELIST.FIELDS_LIKE.includes(name)
  )
}

const FILTERS_RULES = {
  FILTER_BLACK_LIST,
  FILTER_WHITELIST,
  verifyWhiteListFields,
  verifyBlackListFields,
  sortFields,
  MOST_RELEVANT_FIELDS,
  FILTER_LIKE_TYPE,
  FILTER_LIKE_ALIAS,
  ALIAS_MAPPING
}

export default FILTERS_RULES
