const getGraphQLType = (value) => {
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Float'
  } else if (value instanceof Date) {
    return 'DateTime'
  } else if (typeof value === 'string') {
    if (!isNaN(Date.parse(value))) {
      return 'DateTime'
    }
    return 'String'
  }
}

const bodyGQL = (filter, table) => {
  let filterQuery = ''
  let variables = {}
  const fieldsFormat = table.fields.join('\n')

  if (filter) {
    if (filter.filterDate && filter.filterDate.tsRangeBegin && filter.filterDate.tsRangeEnd) {
      filterQuery += `tsRange: { begin: $tsRange_begin, end: $tsRange_end }`
      variables.tsRange_begin = filter.filterDate.tsRangeBegin
      variables.tsRange_end = filter.filterDate.tsRangeEnd
    }

    if (filter.and) {
      // not implemented
      const and = filter.and
      Object.keys(and).forEach((key) => {
        if (filterQuery !== '') filterQuery += ', '
        filterQuery += `${key}: $and_${key}`
        variables[`and_${key}`] = and[key]
      })
    }

    if (filter.in) {
      // not implemented
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
    query: query,
    variables: variables
  }

  return bodyGQL
}

export default bodyGQL
