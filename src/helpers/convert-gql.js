/**
 * Return the type of variable related to graphql types
 * @param {number} value – value that I must recognize the type
 * @returns {String} Returns the type of the variable relative to the graphql type
 */
const getGraphQLType = (value) => {
  if (Array.isArray(value)) {
    return '[String]'
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float'
  } else if (value instanceof Date) {
    return 'DateTime'
  } else if (typeof value === 'string') {
    const isNumberString = !isNaN(Number(value))
    if (isNumberString) {
      return 'String'
    }

    if (!isNaN(Date.parse(value))) {
      return 'DateTime'
    }

    return 'String'
  }
}

/**
 * Builds a GraphQL query based on the provided parameters.
 *
 * @param {object} options - The options object containing filterParameter, dataset, limit, orderBy, filterQuery, and fields.
 * @return {string} The constructed GraphQL query string.
 */
function buildGraphQLQuery({ filterParameter, dataset, limit, orderBy, filterQuery, fields }) {
  const filter = filterQuery.map((field) => `\t\t\t${field}`).join('\n')
  return [
    `query (`,
    filterParameter.join('\n'),
    `) {`,
    `\t${dataset} (`,
    `\t\tlimit: ${limit}`,
    `\t\torderBy: [${orderBy}]`,
    `\t\tfilter: {`,
    filter,
    `\t\t}`,
    `\t) {`,
    fields,
    `\t}`,
    `}`
  ].join('\n')
}

/**
 * Convert filter and table to gql body
 *
 * @param {Object} filter - Object with the filter to apply
 * @param {Object} table - Object with the table to query
 * @returns {Object} Returns the body of the gql query with variables
 */
const convertGQL = (filter, table) => {
  if (!table) throw new Error('Table parameter is required')

  const variables = {}
  const filterQuery = buildFilterQuery(filter, variables)

  const fieldsFormat = table.fields.map((field) => `\t\t${field}`).join('\n')
  const filterParameter = formatFilterParameter(variables)

  const queryConfig = {
    filterParameter,
    dataset: table.dataset,
    limit: table.limit,
    orderBy: table.orderBy,
    filterQuery,
    fields: fieldsFormat
  }
  const query = buildGraphQLQuery(queryConfig)

  return {
    query,
    variables
  }
}

/**
 * Build the filter query and populate variables.
 * @param {Object} filter
 * @param {Object} variables
 * @returns {Array<String>} filterQueries
 */
const buildFilterQuery = (filter, variables) => {
  if (!filter) return []

  let filterQueries = []

  if (filter.fields) {
    const separatedObjects = separateFieldsByType(filter.fields)
    mergeFieldsIntoFilter(separatedObjects.others, filter)
    filterQueries.push(...buildRangeQueries(separatedObjects.range, variables))
  }

  if (filter.tsRange) {
    filterQueries.push(...buildTsRangeQuery(filter.tsRange, variables))
  }

  if (filter.and) {
    filterQueries.push(...buildFilterQueriesWithPrefix(filter.and, variables, 'and'))
  }

  if (filter.in) {
    filterQueries.push(...buildFilterQueriesWithPrefix(filter.in, variables, 'in'))
  }

  return filterQueries
}

/**
 * Separate fields by their operator type.
 * @param {Array} fields
 * @returns {Object} separated fields
 */
const separateFieldsByType = (fields) => {
  return fields.reduce(
    (newFilters, item) => {
      const key = item.operator === 'Range' ? 'range' : 'others'
      newFilters[key].push(item)
      return newFilters
    },
    { range: [], others: [] }
  )
}

/**
 * Merges fields into the given filter object, separating 'In' operators into a distinct 'in' property.
 *
 * @param {Array} fields - Array of field objects to be merged.
 * @param {Object} filter - The filter object where the fields will be merged.
 */
const mergeFieldsIntoFilter = (fields, filter) => {
  fields.forEach(({ operator, valueField, value }) => {
    const filterKey = operator === 'In' ? 'in' : 'and'
    filter[filterKey] = {
      ...filter[filterKey],
      [`${valueField}${operator}`]: value
    }
  })
}

/**
 * Build range queries.
 * @param {Array} range
 * @param {Object} variables
 * @returns {Array<String>} rangeQueries
 */
const buildRangeQueries = (range, variables) => {
  return range.map((field) => {
    variables[`${field.valueField}Range_begin`] = field.value.begin
    variables[`${field.valueField}Range_end`] = field.value.end
    return `${field.valueField}Range: { begin: $${field.valueField}Range_begin, end: $${field.valueField}Range_end }`
  })
}

/**
 * Build timestamp range query.
 * @param {Object} tsRange
 * @param {Object} variables
 * @returns {Array<String>} tsRangeQueries
 */
const buildTsRangeQuery = (tsRange, variables) => {
  const tsRangeQueries = []
  if (tsRange.tsRangeBegin && tsRange.tsRangeEnd) {
    variables.tsRange_begin = tsRange.tsRangeBegin
    variables.tsRange_end = tsRange.tsRangeEnd
    tsRangeQueries.push(`tsRange: { begin: $tsRange_begin, end: $tsRange_end }`)
  }
  return tsRangeQueries
}

/**
 * Builds GraphQL filter queries with a specified variable name prefix.
 * @param {Object} filter - The filter object containing the fields and values for queries.
 * @param {Object} variables - The variables object to be populated with filter values.
 * @param {string} prefix - The prefix for the variable names in the queries.
 * @returns {Array<string>} - An array of GraphQL filter query strings using the specified prefix for variables.
 */
const buildFilterQueriesWithPrefix = (filter, variables, prefix) => {
  return Object.entries(filter).map(([key, value]) => {
    const variableName = `${prefix}_${key}`
    variables[variableName] = Array.isArray(value) ? value.map((item) => `${item.value}`) : value
    return `${key}: $${variableName}`
  })
}

/**
 * Format filter parameters for the GraphQL query.
 * @param {Object} variables
 * @returns {String} formattedFilterParameter
 */
const formatFilterParameter = (variables) => {
  return Object.keys(variables).map((key) => `\t$${key}: ${getGraphQLType(variables[key])}!`)
}

export default convertGQL
