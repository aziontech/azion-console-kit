import TEXT_DOMAIN_WORKLOAD from './handle-text-workload-domain-flag'

const FILTERS_RULES = () => {
  const FILTER_BLACK_LIST = [
    'clientId',
    'clientIdNe',
    'clientIdLike',
    'clientIdEq',
    'clientIdIlike',
    'naxsiAttackFamilyEq',
    'naxsiAttackFamilyNe',
    'naxsiAttackFamilyLike',
    'naxsiAttackFamilyIlike',
    'classifiedLike',
    'classifiedIlike',
    'classifiedIn',
    'classifiedNotIn',
    'classifiedIsNull',
    'actionLike',
    'actionIlike',
    'actionIn',
    'actionNotIn',
    'actionIsNull',
    'sourceEq',
    'sourceNe',
    'sourceLike',
    'sourceIlike',
    'sourceIn',
    'sourceNotIn',
    'source'
  ]

  const SUPPORTED_FILTER_TYPE = [
    'String',
    'Int',
    'Float',
    'IntRange',
    'FloatRange',
    'GenericScalar'
  ]
  const FIELDS_LIKE = [
    'configurationIdIn',
    'zoneIdIn',
    'edgeFunctionIdIn',
    'botCategoryIn',
    'challengeSolvedEq'
  ]

  const ALIAS_MAPPING = {
    configurationId: TEXT_DOMAIN_WORKLOAD().singularLabel
  }

  const FILTER_WHITELIST = {
    SUPPORTED_FILTER_TYPE,
    FIELDS_LIKE
  }

  const MOST_RELEVANT_FIELDS = {
    httpMetrics: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Status',
      'Upstream Status',
      'Upstream Cache Status',
      'Request Time'
    ],
    httpEvents: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Status',
      'Upstream Status',
      'Upstream Cache Status',
      'Request Time'
    ],
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
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Edge Function Id',
      'Compute Time',
      'Invocations',
      'Edge Functions Instance Id List'
    ],
    edgeFunctionsEvents: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Edge Function Id',
      'Compute Time',
      'Invocations',
      'Edge Functions Instance Id List'
    ],
    imagesProcessedMetrics: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Status',
      'Upstream Status',
      'Upstream Cache Status',
      'Request Time'
    ],
    imagesProcessedEvents: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Status',
      'Upstream Status',
      'Upstream Cache Status',
      'Request Time'
    ],
    idnsQueriesEvents: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
    idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
    dataStreamedEvents: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Data Streamed',
      'Endpoint Type',
      'Requests',
      'Configuration Id'
    ],
    dataStreamedMetrics: [
      TEXT_DOMAIN_WORKLOAD().singularTitle,
      'Status',
      'Data Streamed',
      'Endpoint Type',
      'Requests'
    ]
  }

  const FILTER_LIKE_TYPE = {
    configurationIdIn: 'ArrayObjectDomain',
    zoneIdIn: 'ArrayObject',
    edgeFunctionIdIn: 'ArrayObject',
    botCategoryIn: 'ArrayObject',
    challengeSolvedEq: 'Boolean',
    classifiedEq: 'StringObject',
    classifiedNe: 'StringObject',
    actionEq: 'StringObject',
    actionNe: 'StringObject'
  }

  const FILTER_LIKE_ALIAS = {
    configurationIdIn: TEXT_DOMAIN_WORKLOAD().singularTitle,
    classifiedEq: 'Classified',
    classifiedNe: 'Classified'
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
    return !FILTER_BLACK_LIST.includes(name)
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
      FILTER_WHITELIST.SUPPORTED_FILTER_TYPE.includes(typeName) ||
      FILTER_WHITELIST.FIELDS_LIKE.includes(name)
    )
  }

  return {
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
}

export default FILTERS_RULES
