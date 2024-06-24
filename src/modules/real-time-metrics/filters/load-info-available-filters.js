import { loadRealTimeMetricsData } from '@/services/real-time-metrics-services'
import { capitalizeFirstLetter } from '@/helpers'

let abortController = null

/**
 * Checks if the given name is an alias and returns the corresponding value from the aliasMapping object.
 *
 * @param {string} name - The name to check for alias.
 * @return {string} The alias value if found, otherwise undefined.
 */
const isAlias = (name) => {
  const aliasMapping = {
    configurationId: 'domain'
  }

  return aliasMapping[name]
}

const datasetListQuery = `query {
  __type(name: "Query") {
    fields {
      name,
      type {
        ofType {
          fields {
            name
            description
            args {
              description
              name
            }
          }
        }
      }
    }
  }
}`

/**
 * Load available filters information from the server and process it.
 *
 * @return {Object} The processed available filters information.
 */
export default async function LoadInfoAvailableFilters() {
  if (abortController) abortController.abort()
  abortController = new AbortController()

  const graphqlQuery = { query: datasetListQuery }

  const result = await loadRealTimeMetricsData({
    query: graphqlQuery,
    signal: abortController.signal
  })

  const availableFilters = result?.__type?.fields || []
  const newAvailableFilters = {}

  availableFilters.forEach((item) => {
    const dataset = item.name
    newAvailableFilters[dataset] = {}
    item.type.ofType.fields.forEach(({ name, description, args }) => {
      const { description: descriptionPlaceholder, name: namePlaceholder } = args[0] || {}
      const placeholder = namePlaceholder
        ? `${capitalizeFirstLetter(namePlaceholder)}: ${descriptionPlaceholder}`
        : ''

      if (placeholder) {
        const fieldData = {
          description,
          placeholder
        }

        newAvailableFilters[dataset][name] = fieldData

        const aliasName = isAlias(name)
        if (aliasName) {
          delete fieldData.placeholder
          newAvailableFilters[dataset][aliasName] = fieldData
        }
      }
    })
  })

  return newAvailableFilters
}
