import BeholderService from '@services/real-time-metrics-services/fetch-metrics-data-from-beholder'
import Axios from 'axios'
import { DatasetListQuery } from '../gql'
import { capitalizeFirstLetter } from '@/helpers'

let cancelRequest = null

const isAlias = (name) => {
  const aliasMapping = {
    configurationId: 'domain'
  }

  return aliasMapping[name]
}

export default async () => {
  if (cancelRequest) cancelRequest.cancel()
  const ReportsRequestToken = Axios.CancelToken
  cancelRequest = ReportsRequestToken.source()

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

  return newAvailableFilters
}
