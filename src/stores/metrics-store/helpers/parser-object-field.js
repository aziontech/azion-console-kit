const likeType = {
  configurationIdIn: 'ArrayObject',
  zoneIdIn: 'ArrayObject',
  edgeFunctionIdIn: 'ArrayObject'
}

const likeAlias = {
  configurationId: 'Domain'
}

/**
 * Returns the field type and whether the field is part of an element.
 *
 * @param {string} name - The name of the field.
 * @param {string} typeName - The type of the field.
 * @return {String} The field type.
 */
const getTypeField = (name, typeName) => {
  if (typeName?.includes('Range')) return 'Range'

  return likeType[name] || typeName || 'String'
}

/**
 * Formats a field name by capitalizing the first letter of each word.
 *
 * @param {string} text - the text to format
 * @return {Object} the formatted field name and value
 */
export const formatFieldName = (text) => {
  const words = text.split(/(?=[A-Z])/)
  if (words.length > 1) words.pop()
  const name = words.join('')
  const group = name
  const formattedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  const label = likeAlias[name] || formattedWords.join(' ')
  return {
    label,
    group,
    value: name
  }
}

/**
 * Retrieves the operator label from the given field name.
 *
 * @param {string} fieldName - The field name to extract the operator label from.
 * @return {string} The extracted operator label.
 */
export const getOperatorLabelFromFieldName = (fieldName) => {
  const words = fieldName.split(/(?=[A-Z])/)
  return words.pop()
}

/**
 * ParserObjectField function to parse object field.
 *
 * @param {Object} name - The name of the object field.
 * @param {string} description - The description of the object field.
 * @param {Object} type - The type object containing name property.
 * @return {Object} An object containing parsed fields.
 */
export default function ParserObjectField({ name, type: { name: typeName } }) {
  const { label, group, value } = formatFieldName(name)
  const operator = getOperatorLabelFromFieldName(name)
  const fieldType = getTypeField(name, typeName)

  return {
    label,
    group,
    value,
    operator,
    type: fieldType
  }
}
