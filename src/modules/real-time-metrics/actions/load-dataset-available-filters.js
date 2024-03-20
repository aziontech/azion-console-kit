import BeholderService from '@services/real-time-metrics-services/fetch-metrics-data-from-beholder'
import Axios from 'axios'
import { ParserObjectField, VerifyBlacklistFields, VerifyWhitelistFields } from '../helpers'
import { capitalizeFirstLetter } from '@/helpers'

let cancelRequest = null

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

export default async (dataset) => {
  if (cancelRequest) cancelRequest.cancel()
  const ReportsRequestToken = Axios.CancelToken
  cancelRequest = ReportsRequestToken.source()

  const datasetsQuery = inputListByDatasetQuery(dataset)

  const graphqlQuery = {
    query: datasetsQuery
  }

  const beholderService = new BeholderService({ cancelRequest })

  let data = []

  try {
    const type = await beholderService.gql(graphqlQuery)
    data = type.__type
  } catch {
    return []
  }

  const availableFilters = data.inputFields
    .filter(VerifyWhitelistFields)
    .filter(VerifyBlacklistFields)
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
