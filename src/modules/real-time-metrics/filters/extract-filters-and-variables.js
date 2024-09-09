/**
 * Extracts time series filter from the given filters object.
 *
 * @param {Object} filters - The filters object containing the time series filter.
 * @returns {Object} - The extracted filter, params, and variables.
 */
function extractTimeSeries(filters) {
  const keyBegin = 'tsRange_begin'
  const keyEnd = 'tsRange_end'
  const typeDateTime = 'DateTime!'

  if (filters.tsRange) {
    const filter = {
      tsRange: {
        begin: `$${keyBegin}`,
        end: `$${keyEnd}`
      }
    }
    const params = [
      {
        name: filter.tsRange.begin,
        type: typeDateTime,
        value: filters.tsRange.begin
      },
      {
        name: filter.tsRange.end,
        type: typeDateTime,
        value: filters.tsRange.end
      }
    ]

    const variables = {
      [keyBegin]: params[0].value,
      [keyEnd]: params[1].value
    }

    return {
      filter,
      params,
      variables
    }
  }
  return null
}

/**
 * Maps the filterIn object to a dataset object.
 *
 * @param {Object} filterIn - The filterIn object to be mapped to a dataset object.
 * @returns {Object} - The mapped dataset object containing filters, params, and variables.
 */
function datasetMapping(filterIn) {
  const filterValues = filterIn.in.map((inMap) => `${inMap.sourceId}`)
  const filterKey = `${filterIn.meta.fieldPrefix}${filterIn.fieldName}`

  return {
    filters: {
      [filterIn.fieldName]: `$${filterKey}`
    },
    params: {
      name: `$${filterKey}`,
      type: filterIn.meta.inputType,
      value: filterValues
    },
    variables: {
      [filterKey]: filterValues
    }
  }
}

/**
 * Extracts datasets from the given filters.
 *
 * @param {Object} filters - The filters object containing datasets.
 * @returns {Array} - The extracted datasets.
 */
function extractDatasets(filters) {
  if (filters.datasets?.length) {
    const datasets = filters.datasets.map(datasetMapping)
    return datasets
  }
  return []
}

/**
 * Checks if the value is a single filter based on the input type.
 *
 * @param {any} value - The value to be checked.
 * @param {string} inputType - The input type to be checked against.
 * @returns {boolean} - True if the value is a single filter, false otherwise.
 */
const isSingleFilter = (value, inputType) => {
  return value || value === 0 || inputType === 'String'
}

/**
 * Extracts and processes the "and" filters from the given filters object.
 *
 * @param {Object} filters - The filters object containing "and" filters.
 * @returns {Object} - The extracted and processed "and" filters containing filters, params, and variables.
 */
function extractAnd(filters) {
  if (filters.and) {
    const filterAnd = {
      and: {}
    }
    const params = []
    const variables = {}

    for (const andFilter in filters.and) {
      if (andFilter === 'meta') continue

      const {
        begin = null,
        end = null,
        value = null,
        meta: { inputType = '' }
      } = filters.and[andFilter]

      if (isSingleFilter(value, inputType)) {
        filterAnd.and[andFilter] = `$${filters.and.meta.fieldPrefix}${andFilter}`
        params.push({
          name: `$${filters.and.meta.fieldPrefix}${andFilter}`,
          type: inputType,
          value
        })
        variables[`${filters.and.meta.fieldPrefix}${andFilter}`] = value
      } else {
        // Range filter
        filterAnd.and[andFilter] = {
          begin: `$${filters.and.meta.fieldPrefix}${andFilter}_begin`,
          end: `$${filters.and.meta.fieldPrefix}${andFilter}_end`
        }

        const type = inputType === 'FloatRange' ? 'Float!' : 'Int!'
        params.push({
          name: `$${filters.and.meta.fieldPrefix}${andFilter}_begin`,
          type,
          value: begin
        })
        params.push({
          name: `$${filters.and.meta.fieldPrefix}${andFilter}_end`,
          type,
          value: end
        })
        variables[`${filters.and.meta.fieldPrefix}${andFilter}_begin`] = begin
        variables[`${filters.and.meta.fieldPrefix}${andFilter}_end`] = end
      }
    }

    return {
      filters: filterAnd,
      params,
      variables
    }
  }
  return null
}

const extractGeneric = (pFilters) => {
  if (pFilters.or) {
    return {
      filters: {
        or: pFilters.or
      }
    }
  }
  if (pFilters.classifiedIn) {
    return {
      filters: {
        classifiedIn: pFilters.classifiedIn
      }
    }
  }

  return null
}

/**
 * Extracts filters, parameters, and variables from the given filters object.
 *
 * @param {Object} pFilters - The filters object to extract from.
 * @return {Object} An object containing the extracted filters, parameters, and variables.
 */
export default function ExtractFiltersAndVariables(pFilters) {
  const filters = {}
  const params = []
  const variables = {}

  const tsRangeFilter = extractTimeSeries(pFilters)
  Object.assign(filters, tsRangeFilter?.filter)
  if (tsRangeFilter?.params) params.push(...tsRangeFilter.params)
  Object.assign(variables, tsRangeFilter?.variables)

  const datasetFilter = extractDatasets(pFilters)
  for (const dataset of datasetFilter) {
    Object.assign(filters, dataset.filters)
    params.push(dataset.params)
    Object.assign(variables, dataset.variables)
  }

  const andFilter = extractAnd(pFilters)
  if (andFilter) {
    Object.assign(filters, andFilter.filters)
    params.push(...andFilter.params)
    Object.assign(variables, andFilter.variables)
  }

  const genericFilter = extractGeneric(pFilters)
  if (genericFilter) {
    Object.assign(filters, genericFilter.filters)
  }

  return {
    filters,
    params,
    variables
  }
}
