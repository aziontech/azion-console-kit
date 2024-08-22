/**
 * Return the type of variable related to graphql types
 * @param {number} value – value that I must recognize the type
 * @returns {String} Returns the type of the variable relative to the graphql type
 */
const getGraphQLType = (value) => {
  if (typeof value === 'number') {
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
  const indentedFields = fields
    .split('\n')
    .map((field) => `    ${field}`)
    .join('\n')

  return [
    `query (${filterParameter}) {`,
    `  ${dataset} (`,
    `    limit: ${limit}`,
    `    orderBy: [${orderBy}]`,
    `    filter: {`,
    `      ${filterQuery}`,
    `    }`,
    `  ) {`,
    indentedFields,
    `  }`,
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

  const fieldsFormat = table.fields.join('\n')
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
 * @returns {String} filterQuery
 */
const buildFilterQuery = (filter, variables) => {
  if (!filter) return ''

  let filterQuery = ''

  if (filter.fields) {
    const separatedObjects = separateFieldsByType(filter.fields)
    addOtherFieldsToAnd(separatedObjects.others, filter)
    filterQuery += buildRangeQueries(separatedObjects.range, variables)
  }

  if (filter.tsRange) {
    filterQuery += buildTsRangeQuery(filter.tsRange, variables)
  }

  if (filter.and) {
    filterQuery += buildAndQueries(filter.and, variables)
  }

  if (filter.in) {
    filterQuery += buildInQueries(filter.in, variables)
  }

  return filterQuery
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
 * Add other fields to the 'and' filter.
 * @param {Array} others
 * @param {Object} filter
 */
const addOtherFieldsToAnd = (others, filter) => {
  const fieldsFormatAnd = others.reduce((newFields, field) => {
    newFields[`${field.valueField}${field.operator}`] = field.value
    return newFields
  }, {})

  filter.and = {
    ...filter.and,
    ...fieldsFormatAnd
  }
}

/**
 * Build range queries.
 * @param {Array} range
 * @param {Object} variables
 * @returns {String} rangeQuery
 */
const buildRangeQueries = (range, variables) => {
  return range
    .map((field) => {
      variables[`${field.valueField}Range_begin`] = field.value.begin
      variables[`${field.valueField}Range_end`] = field.value.end
      return `${field.valueField}Range: { begin: $${field.valueField}Range_begin, end: $${field.valueField}Range_end }`
    })
    .join(', ')
}

/**
 * Build timestamp range query.
 * @param {Object} tsRange
 * @param {Object} variables
 * @returns {String} tsRangeQuery
 */
const buildTsRangeQuery = (tsRange, variables) => {
  if (tsRange.tsRangeBegin && tsRange.tsRangeEnd) {
    variables.tsRange_begin = tsRange.tsRangeBegin
    variables.tsRange_end = tsRange.tsRangeEnd
    return `tsRange: { begin: $tsRange_begin, end: $tsRange_end }`
  }
  return ''
}

/**
 * Build 'and' queries.
 * @param {Object} and
 * @param {Object} variables
 * @returns {String} andQuery
 */
const buildAndQueries = (and, variables) => {
  return Object.keys(and)
    .map((key) => {
      variables[`and_${key}`] = and[key]
      return `${key}: $and_${key}`
    })
    .join(', ')
}

/**
 * Build 'in' queries.
 * @param {Object} inFilter
 * @param {Object} variables
 * @returns {String} inQuery
 */
const buildInQueries = (inFilter, variables) => {
  return Object.keys(inFilter)
    .map((key) => {
      variables[`in_${key}`] = inFilter[key]
      return `${key}In: $in_${key}`
    })
    .join(', ')
}

/**
 * Format filter parameters for the GraphQL query.
 * @param {Object} variables
 * @returns {String} formattedFilterParameter
 */
const formatFilterParameter = (variables) => {
  return Object.keys(variables)
    .map((key) => `$${key}: ${getGraphQLType(variables[key])}!`)
    .join(', ')
}

export default convertGQL
