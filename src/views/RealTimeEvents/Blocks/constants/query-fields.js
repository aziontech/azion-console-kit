import { capitalizeFirstLetter, FILTERS_RULES } from '@/helpers'
import { MAP_SERVICE_OPERATION } from '@modules/real-time-metrics/constants'

const buildOperatorQuery = (dataset) => `
  query {  
    operatorsDataSet: __type(name: "${capitalizeFirstLetter(dataset)}Filter") {
      inputFields {
        name
        deprecated: description
        type {
          name
        }
      }
    }
  }
`
const ALIAS_MAPPING_OPERATOR = {
  configurationIdIn: 'domain'
}

const buildFieldsQuery = () => `
  query {
    fieldsDataSet:__type(name: "Query") {
      fields {
        name,
        type {
          ofType {
            fields {
              name
              description
              placeholder: args {
                value: description
                name
              }
            }
          }
        }
      }
    }
  }
`

const formatFieldName = (name) => {
  const words = name.split(/(?=[A-Z])/)  
  const formattedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1))

  return formattedWords.join(' ')
}

const splitFieldNameAndOperator = (text) => {
  const [name, operatorValue] = text.split(/(?=[A-Z][^A-Z]*$)/)
  return { name, operatorValue }
}

const formatFieldData = (fieldData) => ({
  name: fieldData.name,
  description: fieldData.description,
  placeholder: fieldData.placeholder.length
    ? `${capitalizeFirstLetter(fieldData.placeholder[0].name)} : ${fieldData.placeholder[0].value}`
    : ''
})

const extractFieldFormat = (fields, dataset) => {
  const datasetField = fields.fieldsDataSet.fields.find(({ name }) => name === dataset)
  return datasetField.type.ofType.fields.reduce((formattedFields, fieldData) => {
    const hasAliasName = FILTERS_RULES.ALIAS_MAPPING[fieldData.name]
    const newField = {
      [fieldData.name]: formatFieldData(fieldData)
    }

    if (hasAliasName) {
      newField[hasAliasName] = formatFieldData(fieldData)
    }

    return {
      ...formattedFields,
      ...newField
    }
  }, {})
}

const formatOperatorData = (operator, fieldName, field) => ({
  value: fieldName.operatorValue,
  group: ALIAS_MAPPING_OPERATOR[operator.name] || fieldName.name,
  type: FILTERS_RULES.FILTER_LIKE_TYPE[operator.name] || operator.type.name || 'String',
  props: {
    placeholder: field?.placeholder,
    services: MAP_SERVICE_OPERATION[operator.name] || []
  }
})

const extractOperatorFormat = (operators, fieldFormat) => {
  return operators
    .filter(FILTERS_RULES.verifyWhiteListFields)
    .filter(FILTERS_RULES.verifyBlackListFields)
    .filter(({ deprecated }) => !deprecated.includes('DEPRECATED'))
    .map((operator) => {
      const fieldOperator = splitFieldNameAndOperator(operator.name)
      return formatOperatorData(operator, fieldOperator, fieldFormat[fieldOperator.name])
    })
    .reduce(
      (groupedOperators, operator) => ({
        ...groupedOperators,
        [operator.group]: [...(groupedOperators[operator.group] ?? []), operator]
      }),
      {}
    )
}

const buildFilterList = (operatorFormat, fieldFormat) => {
  return Object.values(operatorFormat).reduce((filterList, operators) => {
    const [firstOperator] = operators
    const formatName = formatFieldName(firstOperator.group)
    const field = fieldFormat[`${firstOperator.group}`]

    if (!field) return filterList

    return [
      ...filterList,
      {
        label: formatName,
        value: field.name,
        description: field.description,
        operator: operators
      }
    ]
  }, [])
}

const adapterFields = (fields, operators, dataset) => {
  const fieldFormat = extractFieldFormat(fields, dataset)

  const operatorFormat = extractOperatorFormat(operators.operatorsDataSet.inputFields, fieldFormat)
  return buildFilterList(operatorFormat, fieldFormat)
}

export { buildFieldsQuery, buildOperatorQuery, adapterFields }
