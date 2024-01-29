import {
  formatFieldName,
  getOperatorLabelFromFieldName
} from '@views/Metrics/utils/convert-metrics-fields'

const likeElement = {
  configurationIdIn: 'domains-filter',
  zoneIdIn: 'idns-filter',
  edgeFunctionIdIn: 'edge-functions-filter'
}

/**
 * Returns the field type and whether the field is part of an element.
 *
 * @param {string} name - The name of the field.
 * @param {string} typeName - The type of the field.
 * @return {object} An object containing the field type and whether the field is part of an element.
 */
const getTypeField = (name, typeName) => {
  const fieldsMapping = {
    Int: 'number-filter',
    Float: 'number-filter',
    String: 'text-filter'
  }

  if (typeName?.includes('Range')) {
    return {
      fieldType: 'range-filter',
      isFieldInElement: false
    }
  }

  const isFieldMapped = fieldsMapping[typeName]
  const isFieldInElement = likeElement[name]

  return {
    fieldType: isFieldMapped || isFieldInElement,
    isFieldInElement: !!isFieldInElement
  }
}

/**
 * Returns the alias label for the given field name.
 *
 * @param {string} name - The field name to retrieve the alias label for.
 * @return {string} The alias label for the given field name.
 */
const aliasFieldLabel = (name) => {
  const aliasMapping = {
    configurationIdIn: 'domainIn'
  }
  return aliasMapping[name] || name
}

/**
 * ParserObjectField function to parse object field.
 *
 * @param {Object} name - The name of the object field.
 * @param {string} description - The description of the object field.
 * @param {Object} type - The type object containing name property.
 * @return {Object} An object containing parsed fields.
 */
export default function ParserObjectField({ name, description, type: { name: typeName } }) {
  const operator = getOperatorLabelFromFieldName(name)
  const value = aliasFieldLabel(name)
  const formattedLabel = formatFieldName(value)
  const typeField = getTypeField(name, typeName)
  const type = typeField.fieldType
  const inputType = typeField.isFieldInElement ? 'String' : typeName
  const nameField = value.slice(0, -operator.length)
  return {
    label: name,
    description,
    value,
    formattedLabel,
    operator,
    type,
    inputType,
    nameField,
    valueElement: undefined
  }
}
