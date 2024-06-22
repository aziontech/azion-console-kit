import { loadRealTimeMetricsData } from '@/services/real-time-metrics-services'
import { FILTERS_RULES } from '@modules/real-time-metrics/constants'
import ParserObjectField from './parser-object-field'
import { capitalizeFirstLetter } from '@/helpers'

let abortController = null

/**
 * A function to generate a GraphQL query for input fields of a given dataset.
 *
 * @param {string} datasetName - The name of the dataset
 * @return {string} The GraphQL query for input fields of the dataset
 */
const inputListByDatasetQuery = (datasetName) => `
query {
__type(name: "${capitalizeFirstLetter(datasetName)}Filter") {
  inputFields {
    name
    description
    type {
      name
      inputFields {
        name
        type {
          name
          ofType {
            name
          }
        }
      }
    }
  }
}
}`

/**
 * Verify if the provided name is blacklisted.
 *
 * @param {object} name - The name to be verified.
 * @return {boolean} Whether the name is blacklisted or not.
 */
const verifyBlacklistFields = ({ name }) => {
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
const verifyWhitelistFields = ({ name, type: { name: typeName } }) => {
  return (
    FILTERS_RULES.FILTER_WHITELIST.SUPPORTED_FILTER_TYPE.includes(typeName) ||
    FILTERS_RULES.FILTER_WHITELIST.FIELDS_LIKE.includes(name)
  )
}

/**
 * Loads the available filters for a given dataset.
 *
 * @param {string} dataset - The name of the dataset.
 * @return {Promise<Array<Object>>} An array of objects representing the available filters.
 */
export default async function LoadDatasetAvailableFilters(dataset) {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  const datasetsQuery = inputListByDatasetQuery(dataset)

  const graphqlQuery = {
    query: datasetsQuery
  }

  let data = []

  try {
    const result = await loadRealTimeMetricsData({
      query: graphqlQuery,
      signal: abortController.signal
    })

    if (result?.__type) {
      data = result.__type
    }
  } catch {
    return []
  }

  if (!data.inputFields) return []
  const availableFilters = data.inputFields
    .filter(verifyWhitelistFields)
    .filter(verifyBlacklistFields)
    .filter(({ description }) => !description.includes('DEPRECATED'))
    .map(ParserObjectField)
    .reduce(
      (acc, item) => ({
        ...acc,
        [item.group]: [...(acc[item.group] ?? []), item]
      }),
      {}
    )

  return Object.keys(availableFilters).map((key) => {
    const fields = availableFilters[key]
    return {
      label: fields[0].label,
      value: fields[0].value,
      operator: fields.map((field) => ({ value: field.operator, type: field.type }))
    }
  })
}
