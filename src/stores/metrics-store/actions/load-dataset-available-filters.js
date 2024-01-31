import BeholderService from '@services/metrics-services/fetch-metrics-data-from-beholder'
import { InputListByDatasetQuery } from '../gql'
import { ParserObjectField, VerifyBlacklistFields, VerifyWhitelistFields } from '../helpers'

let cancelRequest = null

export default async (dataset) => {
  const datasetsQuery = InputListByDatasetQuery(dataset)

  const graphqlQuery = {
    query: datasetsQuery
  }

  const beholderService = new BeholderService({ cancelRequest })

  let data = []

  try {
    const type = await beholderService.gql(graphqlQuery)
    data = type.__type
  } catch (error) {
    return false
  }

  const availableFilters = data.inputFields
    .filter(VerifyWhitelistFields)
    .filter(VerifyBlacklistFields)
    .filter(({ description }) => !description.includes('DEPRECATED'))
    .map(ParserObjectField)

  cancelRequest = true
  return availableFilters
}
