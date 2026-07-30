import { makeListService } from '../_shared/make-list-service'

const DATASET = 'edgeDnsQueriesEvents'

export const listEdgeDNS = makeListService({
  dataset: DATASET,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    id,
    summary,
    ts,
    tsFormat,
    uuid: item.uuid
  })
})
