/**
 * Stable identity for a row. Real events always carry `row.id`; when a row lacks
 * one we fall back to object identity (stable for the row's lifetime in the
 * buffer). Shared so every id-keyed derivation agrees under eviction/reorder.
 *
 * @param {any} row
 * @returns {string | number | object}
 */
export const rowKey = (row) => (row?.id != null ? row.id : row)
