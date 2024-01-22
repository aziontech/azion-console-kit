/**
 * Sets the meta data for a given filter, based on the filter key and available filters.
 *
 * @param {string} filterKey - The key of the filter to set meta data for.
 * @param {object} filter - The filter to set meta data for.
 * @param {array} availableFilters - The available filters to search for filter details.
 * @return {object|boolean} The updated filter with meta data, or false if filter detail is not found.
 */
function setFilterTypeMeta(filterKey, filter, availableFilters) {
  if (filterKey === 'meta') return filter

  const filterDetail = availableFilters.find(
    (filterAvailable) => filterAvailable.label === filterKey
  )

  if (!filterDetail) return false

  const filterWithMeta = {
    ...filter,
    meta: {
      inputType: filterDetail.inputType
    }
  }
  return filterWithMeta
}

/**
 * Sets the meta data for the given filter using the available filters.
 *
 * @param {object} filter - The filter to set meta data for
 * @param {array} availableFilters - The available filters to search for meta data
 * @return {object|boolean} The filter with meta data or false if filter detail is not found
 */
function setFilterDatasetMeta(filter, availableFilters) {
  const filterDetail = availableFilters.find(
    (filterAvailable) => filterAvailable.label === filter.fieldName
  )

  if (!filterDetail) return false

  const filterWithMeta = {
    ...filter,
    meta: {
      ...filter.meta,
      fieldPrefix: `new_${filter.fieldAlias}_`,
      inputType: `[${filterDetail.inputType}]`
    }
  }

  return filterWithMeta
}

/**
 * Mounts filter types based on the provided filters and available filter types.
 *
 * @param {object} filters - The filters to be mounted
 * @param {object} availableFilters - The available filter types
 * @return {object} The mounted filter types
 */
export default function MountFilterTypes(filters, availableFilters) {
  const andFilter = {}

  if (filters.and) {
    for (const filter in filters.and) {
      const filterType = setFilterTypeMeta(filter, filters.and[filter], availableFilters)
      if (filterType) {
        andFilter[filter] = filterType
      }
    }
  }

  const datasetsFilter = []

  if (filters.datasets) {
    for (const [filter] in filters.datasets) {
      const filterType = setFilterDatasetMeta(filters.datasets[filter], availableFilters)
      if (filterType) {
        datasetsFilter[filter] = filterType
      }
    }
  }

  return {
    tsRange: filters.tsRange,
    and: andFilter,
    datasets: datasetsFilter
  }
}
