import { capitalizeFirstLetter } from '@/helpers'

/**
 * GraphQL introspection query for a dataset's Filter input type.
 * Returns the list of available `inputFields` (e.g. hostEq, statusIn, ...).
 *
 * @param {string} dataset - Dataset name (e.g. 'workloadEvents', 'httpMetrics').
 * @return {string} GraphQL query string.
 */
export const datasetFilterIntrospectionQuery = (dataset) => `query {
  __type(name: "${capitalizeFirstLetter(dataset)}Filter") {
    inputFields {
      name
      description
      type {
        name
        inputFields {
          name
          type {
            name
            ofType {
              name
            }
          }
        }
      }
    }
  }
}`

/**
 * GraphQL introspection query for all datasets exposed by the root Query type.
 * Returns each dataset's fields with their descriptions and first-argument metadata
 * (used to produce the `placeholder` shown in the filter input).
 *
 * @return {string} GraphQL query string.
 */
export const datasetListIntrospectionQuery = `query {
  __type(name: "Query") {
    fields {
      name
      type {
        ofType {
          fields {
            name
            description
            args {
              description
              name
            }
          }
        }
      }
    }
  }
}`

/**
 * Introspects the root `Query` type to build a map of
 * `dataset name → underlying GraphQL object type name`. The type name is
 * needed to introspect a dataset's own fields — it often differs from the
 * dataset name (e.g. `workloadEvents` resolves to `HttpEventsAggregatedFieldsLogType`).
 *
 * The query walks the chain: `Query.fields[].type → ofType → ofType → name`,
 * covering both `[Foo!]!` and `[Foo]` wrappings.
 *
 * @return {string} GraphQL query string.
 */
export const datasetTypeMapIntrospectionQuery = `query {
  __type(name: "Query") {
    fields {
      name
      type {
        name
        ofType {
          name
          ofType {
            name
            ofType {
              name
            }
          }
        }
      }
    }
  }
}`

/**
 * Introspects a single dataset's response object type for its field names.
 * Used to replace the curated list with the live schema's field set when a
 * dataset is first selected — self-heals docs↔API drift.
 *
 * @param {string} typeName - GraphQL type name (resolved from datasetTypeMapIntrospectionQuery)
 * @return {string} GraphQL query string.
 */
export const datasetObjectFieldsIntrospectionQuery = (typeName) => `query {
  __type(name: "${typeName}") {
    fields {
      name
    }
  }
}`

/**
 * Introspects the enum of fields accepted by the `aggregate:` argument of a
 * Metrics dataset (sum / count / max / min / avg / rate). By convention the
 * enum is named `<Dataset>AggregatedFields` (e.g. `HttpMetricsAggregatedFields`).
 *
 * The returned enum values are the only field names the live backend accepts
 * inside `aggregate: { sum: ... }`. Filtering `METRICS_CHART_CONFIGS` against
 * this set prevents docs↔backend drift from producing 400 "Expected type
 * ...AggregatedFields, found <field>" errors.
 *
 * @param {string} dataset - Metrics dataset (e.g. 'httpMetrics', 'botManagerMetrics')
 * @return {string} GraphQL query string.
 */
export const datasetAggregableFieldsIntrospectionQuery = (dataset) => `query {
  __type(name: "${capitalizeFirstLetter(dataset)}AggregatedFields") {
    enumValues {
      name
    }
  }
}`
