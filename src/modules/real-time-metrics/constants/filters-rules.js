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

const FILTERS_RULES = {
  FILTER_BLACK_LIST,
  FILTER_WHITELIST
}

export default FILTERS_RULES
