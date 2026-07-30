import { makeListService } from '../_shared/make-list-service'

const DATASET = 'functionEvents'

export const listEdgeFunctions = makeListService({
  dataset: DATASET,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    id,
    summary,
    ts,
    tsFormat,
    configurationId: item.configurationId
  })
})
