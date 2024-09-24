import {
  ExtractFiltersAndVariables,
  FiltersToGraphQLString
} from '@modules/real-time-metrics/filters'

/**
 * Describes the structure of the GraphQL query.
 *
 * @param {Object} options - The options object.
 * @param {string} options.dataset - The name of the dataset.
 * @param {Array} options.aggregations - The list of aggregations used.
 * @param {Object} options.filters - The filters to be applied.
 * @param {Object} options.fields - The fields to be included.
 * @param {Array} options.groupBy - The list of grouping variables.
 * @param {string} options.orderBy - The variable to order the data by.
 * @param {number} options.limit - The limit of data records to be retrieved.
 * @param {boolean} options.isTopX - Whether the obtained data is in the Top X format.
 * @param {string} options.xAxis - The X-axis variable.
 * @param {string} options.orderDirection - The direction of ordering.
 * @param {string} options.aggregationType - The direction of type.
 */
export default class GqlRules {
  queryBody = {}

  queryVariables = {}

  filterDetails = []

  queryFilters = {}

  constructor({
    dataset,
    aggregations = [],
    filters = {},
    fields = {},
    groupBy = [],
    orderBy,
    limit = 2000,
    isTopX = false,
    xAxis = 'ts',
    orderDirection = 'ASC',
    aggregationType = 'sum'
  }) {
    this.dataset = dataset
    this.aggregations = aggregations
    this.filters = filters
    this.fields = fields
    this.groupBy = groupBy
    this.orderBy = orderBy
    this.limit = limit
    this.isTopX = isTopX
    this.xAxis = xAxis
    this.orderDirection = orderDirection
    this.aggregationType = aggregationType
  }

  /**
   * Sets the group by parameter for the query result.
   *
   * @param {Array} groupByParam - the array of fields to group by
   * @return {void}
   */
  setGroupBy(groupByParam = []) {
    if (Array.isArray(groupByParam)) {
      const hasSameGroupBy = groupByParam.some((group) => this.groupBy.includes(group))
      if (!hasSameGroupBy) this.groupBy.push(...groupByParam)
    }

    const isXAxisTS = this.xAxis === 'ts'

    const hasAxisTSAndGroupBy = !!(this.groupBy?.length && isXAxisTS)
    const hasGroupByAxis = hasAxisTSAndGroupBy && this.groupBy.includes(this.xAxis)
    if (!hasGroupByAxis && !this.isTopX && isXAxisTS) this.groupBy.unshift(this.xAxis)
  }

  /**
   * Sets the value of 'orderBy' based on the conditions of 'isTopX', 'aggregations', 'fields', and 'xAxis'.
   *
   * @return {void}
   */
  setOrderBy() {
    const hasAggregation = this.aggregations?.length
    if (this.isTopX) {
      if (hasAggregation) {
        this.orderBy = `${this.aggregations[0].aggregation}_${this.orderDirection}`
      } else {
        ;[this.orderBy] = this.fields
      }
    } else if (this.xAxis === 'ts') {
      this.orderBy = `ts_${this.orderDirection}`
    } else if (hasAggregation) {
      this.orderBy = `${this.aggregations[0].aggregation}_${this.orderDirection}`
    } else {
      this.orderBy = this.xAxis
    }
  }

  /**
   * Sets the filters and variables for the query result.
   *
   * @return {void}
   */
  setFiltersAndVariables() {
    const { filters, params, variables } = ExtractFiltersAndVariables(this.filters)

    this.queryFilters = filters
    this.filterDetails = params
    this.queryVariables = variables
  }

  /**
   * Generates a GraphQL query based on the set group by, order by, filters, and variables.
   *
   * @return {Object} The GraphQL query and its variables.
   */
  generateGqlQuery() {
    this.setGroupBy()
    this.setOrderBy()
    this.setFiltersAndVariables()

    let filtersStr = ''
    const fields = Object.values(this.fields)

    if (Object.keys(this.filters).length) {
      Object.keys(this.queryFilters).forEach((key) => {
        filtersStr += FiltersToGraphQLString(key, this.queryFilters[key])
      })
    }

    let aggregationsText = ''
    if (this.aggregations.length) {
      aggregationsText += 'aggregate: {'
      this.aggregations.forEach((aggregation) => {
        aggregationsText += `${aggregation.aggregation}: ${aggregation.variable} \n`
        fields.push(aggregation.aggregation)
      })
      aggregationsText += '}'
    }

    if (this.groupBy !== null) fields.push(...this.groupBy)

    const params = this.filterDetails.map((param) => `${param.name}:${param.type}`)
    const query = `query (${params.join(', ')}) {
      ${this.dataset} (
        limit: ${this.limit}
        ${aggregationsText}
        groupBy: [${this.groupBy.join(', ')}]
        orderBy: [${this.orderBy}]
        filter: {
          ${filtersStr}
        }
        ) {
          ${[...new Set(fields)].join('\n')}
        }
      }`

    const graphQLQuery = {
      query,
      variables: this.queryVariables
    }

    this.queryBody = query

    return graphQLQuery
  }
}
