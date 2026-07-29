import { makeListService } from '../_shared/make-list-service'

const DATASET = 'activityHistoryEvents'

export const listActivityHistory = makeListService({
  dataset: DATASET,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    id,
    summary,
    userId: item.userId,
    ts,
    tsFormat
  })
})
