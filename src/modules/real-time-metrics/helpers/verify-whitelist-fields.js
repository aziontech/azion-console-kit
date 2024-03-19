const SUPPORTED_FILTER_TYPE = ['String', 'Int', 'Float', 'IntRange', 'FloatRange']
const FIELDS_LIKE = ['configurationIdIn', 'zoneIdIn', 'edgeFunctionIdIn']

/**
 * Verify if the whitelist fields are supported.
 *
 * @param {object} name - the name of the field
 * @param {object} type - the type object containing the name of the type
 * @param {string} type.name - the name of the type
 * @return {boolean} true if the field is supported, false otherwise
 */
export default function VerifyWhitelistFields({ name, type: { name: typeName } }) {
  return SUPPORTED_FILTER_TYPE.includes(typeName) || FIELDS_LIKE.includes(name)
}
