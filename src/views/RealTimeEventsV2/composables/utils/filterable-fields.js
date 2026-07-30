/**
 * Fields that must never offer add/exclude filter actions: their values are
 * unbounded blobs (rule-execution traces, raw dumps) that the events GraphQL
 * filter does not accept as equality clauses. Copy stays available.
 */
const NON_FILTERABLE_FIELDS = new Set(['stacktrace'])

export const isFieldFilterable = (key) => !NON_FILTERABLE_FIELDS.has(String(key))
