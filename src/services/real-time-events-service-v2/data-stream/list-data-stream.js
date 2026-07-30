import { makeListService } from '../_shared/make-list-service'

const DATASET = 'dataStreamedEvents'

// Explicit field list (not the curated one): this service pins its own order.
export const listDataStream = makeListService({
  dataset: DATASET,
  fields: [
    'configurationId',
    'jobName',
    'endpointType',
    'url',
    'statusCode',
    'ts',
    'dataStreamed',
    'streamedLines'
  ],
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    configurationId: item.configurationId,
    id,
    summary,
    ts,
    tsFormat
  })
})
