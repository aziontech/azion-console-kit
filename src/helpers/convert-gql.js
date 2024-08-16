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
 * @param {Object} Filter - Object with the filter to apply
 * @param {Object} Table - Object with the table to query
 * @returns {String} Returns the body of the gql query with variables
 */
const convertGQL = (filter, table) => {
  if (!table) {
    throw new Error('Table parameter is required')
  }

  let filterQuery = ''
  let variables = {}

  if (filter) {
    if (filter.fields) {
      const separatedObjects = filter.fields.reduce(
        (newFilters, item) => {
          if (item.operator === 'Range') {
            newFilters.range.push(item)
          } else {
            newFilters.others.push(item)
          }
          return newFilters
        },
        { range: [], others: [] }
      )

      const fieldsFormatAnd = separatedObjects.others.reduce((newFields, field) => {
        newFields[`${field.valueField}${field.operator}`] = field.value
        return newFields
      }, {})

      filter.and = {
        ...filter.and,
        ...fieldsFormatAnd
      }

      separatedObjects.range.forEach((field) => {
        if (filterQuery !== '') filterQuery += ', '
        filterQuery += `${field.valueField}Range: { begin: $${field.valueField}Range_begin, end: $${field.valueField}Range_end },\n`
        variables[`${field.valueField}Range_begin`] = field.value.begin
        variables[`${field.valueField}Range_end`] = field.value.end
      })
    }

    if (filter.tsRange && filter.tsRange.tsRangeBegin && filter.tsRange.tsRangeEnd) {
      filterQuery += `tsRange: { begin: $tsRange_begin, end: $tsRange_end }`
      variables.tsRange_begin = filter.tsRange.tsRangeBegin
      variables.tsRange_end = filter.tsRange.tsRangeEnd
    }

    if (filter.and) {
      const and = filter.and
      Object.keys(and).forEach((key) => {
        if (filterQuery !== '') filterQuery += ', '
        filterQuery += `${key}: $and_${key}`
        variables[`and_${key}`] = and[key]
      })
    }

    if (filter.in) {
      const inFilter = filter.in
      Object.keys(inFilter).forEach((key) => {
        if (filterQuery !== '') filterQuery += ', '
        filterQuery += `${key}In: $in_${key}`
        variables[`in_${key}`] = inFilter[key]
      })
    }
  }

  const fieldsFormat = table.fields.join('\n')

  const filterParameter = Object.keys(variables)
    .map((key) => `$${key}: ${getGraphQLType(variables[key])}!`)
    .join(', ')

  const queryConfig = {
    filterParameter,
    dataset: table.dataset,
    limit: table.limit,
    orderBy: table.orderBy,
    filterQuery,
    fields: fieldsFormat
  }

  const query = buildGraphQLQuery(queryConfig)

  const bodyGQL = {
    query,
    variables
  }

  return bodyGQL
}

export default convertGQL
