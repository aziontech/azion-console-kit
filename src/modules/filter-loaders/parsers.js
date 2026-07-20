import ParserObjectField from '@/modules/real-time-metrics/filters/parser-object-field'
import { capitalizeFirstLetter, FILTERS_RULES, TEXT_DOMAIN_WORKLOAD } from '@/helpers'

/**
 * Parses the introspection result of a `<Dataset>Filter` input type into
 * a flat, UI-ready list of filter fields with their operators.
 *
 * Shape returned (same consumed by `AdvancedFilterSystem`):
 * ```
 * [
 *   {
 *     label: 'Host',
 *     value: 'host',
 *     operator: [
 *       { value: 'Eq', type: 'String' },
 *       { value: 'In', type: 'String' },
 *       ...
 *     ]
 *   },
 *   ...
 * ]
 * ```
 *
 * @param {Object} introspectionResult - GraphQL response data (the object returned under `data`).
 * @return {Array<Object>} Parsed filters list.
 */
export const parseDatasetAvailableFilters = (introspectionResult) => {
  const type = introspectionResult?.__type
  if (!type?.inputFields) return []

  const grouped = type.inputFields
    .filter(FILTERS_RULES().verifyWhiteListFields)
    .filter(FILTERS_RULES().verifyBlackListFields)
    .filter(({ description }) => !description?.includes('DEPRECATED'))
    .map(ParserObjectField)
    .reduce(
      (acc, item) => ({
        ...acc,
        [item.group]: [...(acc[item.group] ?? []), item]
      }),
      {}
    )

  return Object.keys(grouped).map((key) => {
    const fields = grouped[key]
    return {
      label: fields[0].label,
      value: fields[0].value,
      operator: fields.map((field) => ({ value: field.operator, type: field.type }))
    }
  })
}

/**
 * Parses the introspection result of the root `Query` type into a per-dataset
 * map of `{ description, placeholder }`.
 *
 * Example:
 * ```
 * {
 *   workloadEvents: {
 *     host: { description: 'Host header', placeholder: 'Host: string' },
 *     ...
 *   }
 * }
 * ```
 *
 * @param {Object} introspectionResult - GraphQL response data.
 * @return {Object} Per-dataset field info map.
 */
export const parseInfoAvailableFilters = (introspectionResult) => {
  const availableFilters = introspectionResult?.__type?.fields || []
  const out = {}

  const handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  const aliasMapping = { configurationId: handleTextDomainWorkload.singularLabel }
  const isAlias = (name) => aliasMapping[name]

  availableFilters.forEach((item) => {
    const dataset = item.name
    out[dataset] = {}

    item.type?.ofType?.fields?.forEach(({ name, description, args }) => {
      const { description: descriptionPlaceholder, name: namePlaceholder } = args?.[0] || {}
      const placeholder = namePlaceholder
        ? `${capitalizeFirstLetter(namePlaceholder)}: ${descriptionPlaceholder}`
        : ''

      if (!placeholder) return

      const fieldData = { description, placeholder }
      out[dataset][name] = fieldData

      const aliasName = isAlias(name)
      if (aliasName) {
        const aliased = { description }
        out[dataset][aliasName] = aliased
      }
    })
  })

  return out
}
