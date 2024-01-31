import BeholderService from '@services/metrics-services/fetch-metrics-data-from-beholder'
import { DatasetListQuery } from '../gql'

let cancelRequest = null

const isAlias = (name) => {
  const aliasMapping = {
    configurationId: 'domain'
  }

  return aliasMapping[name]
}

const capitalizeFirstLetter = (string) => string.charAt(0).toUpperCase() + string.slice(1)

export default async () => {
  const graphqlQuery = { query: DatasetListQuery }

  const beholderService = new BeholderService({ cancelRequest })
  const { __type } = await beholderService.gql(graphqlQuery)

  const availableFilters = __type.fields
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

  cancelRequest = true

  return newAvailableFilters
}
