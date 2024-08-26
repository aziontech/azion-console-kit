import { loadRealTimeMetricsData } from '@/services/real-time-metrics-services'
import ParserObjectField from '@/modules/real-time-metrics/filters/parser-object-field'
import { capitalizeFirstLetter, FILTERS_RULES } from '@/helpers'

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
    .filter(FILTERS_RULES.verifyWhiteListFields)
    .filter(FILTERS_RULES.verifyBlackListFields)
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
