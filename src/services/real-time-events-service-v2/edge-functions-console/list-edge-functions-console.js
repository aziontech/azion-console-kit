import { makeListService } from '../_shared/make-list-service'

const DATASET = 'functionConsoleEvents'

// emptyAsArray preserves this service's legacy shape: an absent dataset
// yields `data: []` rather than the sibling services' `data: undefined`.
export const listEdgeFunctionsConsole = makeListService({
  dataset: DATASET,
  emptyAsArray: true,
  mapRow: (item, { id, summary, ts, tsFormat }) => ({
    summary,
    configurationId: item.configurationId,
    line: item.line,
    id,
    tsFormat,
    ts
  })
})
