import { convertGQL } from '@/helpers/convert-gql'
import { AxiosHttpClientSignalDecorator } from '@/services/axios/AxiosHttpClientSignalDecorator'
import { makeRealTimeEventsBaseUrl } from '../make-real-time-events-service'
import { generateCurrentTimestamp } from '@/helpers/generate-timestamp'
import { useGraphQLStore } from '@/stores/graphql-query'
import { buildSummary, getCurrentTimezone } from '@/helpers'
import { parseGraphQLResponse } from '@/services/real-time-events-service-v2/_shared/service/parse-graphql-response'
import { CURATED_DATASET_FIELDS } from './dataset-fields'

const SHOULD_SHOW_TS_COLUMN = false
const SHOULD_LIMIT_REQUEST_URI = true

/**
 * Common per-row context shared by every RTE v2 list service: the generated
 * id, the request-uri-limited summary and the raw/formatted timestamp. mapRow
 * places these among the dataset-specific fields to preserve each service's
 * exact key order (byte-parity via JSON.stringify).
 */
const buildRowContext = (item) => ({
  id: generateCurrentTimestamp(),
  summary: buildSummary(item, SHOULD_LIMIT_REQUEST_URI, SHOULD_SHOW_TS_COLUMN),
  ts: item.ts,
  tsFormat: getCurrentTimezone(item.ts)
})

/**
 * Factory for the RTE v2 list services. Holds the identical request/parse
 * boilerplate; each caller supplies only the declarative differences.
 *
 * @param {object} config
 * @param {string} config.dataset - GraphQL dataset name.
 * @param {readonly string[]} [config.fields] - Explicit field list; defaults to
 *   the curated list for `dataset`.
 * @param {(item: any, ctx: {id,summary,ts,tsFormat}) => object} config.mapRow -
 *   Maps one raw event to the service's row shape (key order is significant).
 * @param {boolean} [config.emptyAsArray=false] - When true, an absent dataset
 *   yields `[]` (edge-functions-console legacy behavior) instead of `undefined`.
 * @returns {(filter: any) => Promise<{ data: any }>}
 */
export const makeListService = ({ dataset, fields, mapRow, emptyAsArray = false }) => {
  const resolveFields = () => (fields ? [...fields] : [...CURATED_DATASET_FIELDS[dataset]])

  const adapt = (filter) => {
    const table = {
      dataset,
      limit: filter?.pageSize || 500,
      ...(filter?.offset && { offset: filter.offset }),
      fields: resolveFields(),
      orderBy: 'ts_DESC'
    }
    return convertGQL(filter, table)
  }

  const mapRows = (list) => list.map((item) => mapRow(item, buildRowContext(item)))

  const adaptResponse = (body) => {
    if (emptyAsArray) {
      const list = body.data?.[dataset]
      return { data: list?.length ? mapRows(list) : [] }
    }
    return { data: body.data[dataset]?.map((item) => mapRow(item, buildRowContext(item))) }
  }

  return async (filter) => {
    const payload = adapt(filter)
    const graphqlStore = useGraphQLStore()
    graphqlStore.setQuery(payload)

    const decorator = new AxiosHttpClientSignalDecorator()

    const httpResponse = await decorator.request({
      baseURL: '/',
      url: makeRealTimeEventsBaseUrl(),
      method: 'POST',
      body: payload
    })

    return parseGraphQLResponse(httpResponse, adaptResponse)
  }
}
