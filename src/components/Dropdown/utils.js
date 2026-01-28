/**
 * Dropdown utilities: pure helpers to support paginated, remotely-searched Dropdowns.
 * These helpers are side-effect-free and easy to unit test.
 */

/**
 * @typedef {Object} ListParams
 * @property {number} page
 * @property {number} pageSize
 * @property {string} search
 * @property {string} [ordering]
 */

/**
 * Build list params for the listService.
 * @param {Object} args
 * @param {number} args.page
 * @param {number} args.pageSize
 * @param {string} [args.search]
 * @param {string} [args.ordering]
 * @returns {ListParams}
 */
export function buildListParams({ page, pageSize, search = '', ordering = 'name' }) {
  return { page, pageSize, search: (search || '').trim(), ordering }
}

/**
 * Determine if the end-of-data has been reached for infinite scroll.
 * End when fewer than pageSize items are received or when options reached total (>0).
 * @param {Object} args
 * @param {number} args.receivedCount
 * @param {number} args.pageSize
 * @param {number} args.optionsLength
 * @param {number} args.total
 * @returns {boolean} true if no more data is available
 */
export function markEndOfData({ receivedCount, pageSize, optionsLength, total }) {
  if (receivedCount < pageSize) return true
  if (total > 0 && optionsLength >= total) return true
  return false
}

/**
 * Check whether the virtual scroller reached the end of the currently loaded list.
 * @param {Object} args
 * @param {number} args.lastIndex - the last rendered index from VirtualScroller
 * @param {number} args.optionsLength - current options length
 * @returns {boolean}
 */
export function isEndOfList({ lastIndex, optionsLength }) {
  if (typeof lastIndex !== 'number') return true
  return lastIndex >= Math.max(0, optionsLength - 1)
}

/**
 * Create a new options array by adding unique items based on optionValue.
 * Does not mutate the original array.
 * @param {Object} args
 * @param {Array<Object>} args.items
 * @param {Array<Object>} args.existing
 * @param {Set<any>} args.loadedIds
 * @param {string} args.optionValue
 * @param {boolean} [args.prepend=false]
 * @returns {Array<Object>} new options array
 */
export function addUniqueItems({
  items = [],
  existing = [],
  loadedIds,
  optionValue,
  prepend = false
}) {
  const incoming = []
  for (const item of items) {
    const id = item?.[optionValue]
    if (!loadedIds.has(id)) {
      loadedIds.add(id)
      incoming.push(item)
    }
  }
  if (!incoming.length) return existing
  return prepend ? incoming.concat(existing) : existing.concat(incoming)
}

/**
 * Build the payload for onSelectOption, optionally reducing to the keys in moreOptions.
 * @param {any} val - selected value (id or object)
 * @param {Object} args
 * @param {string[]} args.moreOptions
 * @param {string} args.optionValue
 * @param {Array<Object>} args.options
 * @returns {any} payload to emit
 */
export function createSelectPayload(val, { moreOptions = [], optionValue, options = [] }) {
  if (!moreOptions.length) return val
  const id = typeof val === 'object' ? val?.[optionValue] : val
  const option =
    options.find((opt) => opt?.[optionValue] === id) || (typeof val === 'object' ? val : null)
  return moreOptions.reduce((acc, key) => {
    acc[key] = option ? option[key] : undefined
    return acc
  }, {})
}
