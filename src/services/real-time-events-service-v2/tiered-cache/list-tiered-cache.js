import { makeListService } from '../_shared/make-list-service'

const DATASET = 'tieredCacheEvents'

export const listTieredCache = makeListService({
  dataset: DATASET,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    configurationId: item.configurationId,
    host: item.host,
    proxyHost: item.proxyHost,
    id,
    summary,
    ts,
    tsFormat
  })
})
