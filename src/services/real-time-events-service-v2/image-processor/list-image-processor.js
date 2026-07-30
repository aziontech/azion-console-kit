import { makeListService } from '../_shared/make-list-service'

const DATASET = 'imagesProcessedEvents'

export const listImageProcessor = makeListService({
  dataset: DATASET,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    id,
    configurationId: item.configurationId,
    httpUserAgent: item.httpUserAgent,
    httpReferer: item.httpReferer,
    summary,
    ts,
    tsFormat
  })
})
