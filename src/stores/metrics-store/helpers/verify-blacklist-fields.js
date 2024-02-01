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

/**
 * Verify if the provided name is blacklisted.
 *
 * @param {object} name - The name to be verified.
 * @return {boolean} Whether the name is blacklisted or not.
 */
export default function VerifyBlacklistFields({ name }) {
  return !FILTER_BLACK_LIST.includes(name)
}
