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
 * Convert filter and table to gql body
 *
 * @param {Object} Filter - Object with the filter to apply
 * @param {Object} Table - Object with the table to query
 * @returns {String} Returns the body of the gql query with variables
 */
const convertGQL = (filter, table) => {
  let filterQuery = ''
  let variables = {}
  const fieldsFormat = table.fields.join('\n')

  if (filter) {
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

  const filterParameter = Object.keys(variables)
    .map((key) => `$${key}: ${getGraphQLType(variables[key])}!`)
    .join(', ')

  const query = `
    query (${filterParameter}) {
      ${table.dataset} (
        limit: ${table.limit}
        orderBy: [${table.orderBy}]
        filter: {
          ${filterQuery}
        }
      ) {
        ${fieldsFormat}
      }
    }
  `

  const bodyGQL = {
    query,
    variables
  }

  return bodyGQL
}

export default convertGQL
