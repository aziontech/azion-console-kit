import BeholderService from '@services/real-time-metrics-services/fetch-metrics-data-from-beholder'
import { AvailableAggregationsQuery } from '../gql'

export default async (dataset) => {
  const graphqlQuery = { query: AvailableAggregationsQuery(dataset) }

  const beholderService = new BeholderService()

  const { __type } = await beholderService.gql(graphqlQuery)
  const aggregationList = __type.inputFields.reduce((aggregations, aggregationType) => {
    const curValue = {}
    curValue[aggregationType.name] = aggregationType.type.enumValues
      .map((value) => value.name)
      .sort()
    return {
      ...aggregations,
      ...curValue
    }
  }, {})

  return aggregationList
}
