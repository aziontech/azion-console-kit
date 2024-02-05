export const operators = {
  Eq: { value: 'Eq', label: 'Equals', format: ({ field, value }) => `${field} = ${value}` },
  Ne: { value: 'Ne', label: 'Not Equals', format: ({ field, value }) => `${field} ≠ ${value}` },
  In: { value: 'In', label: 'In', format: ({ field, value }) => `${field} IN (${value})` },
  Like: { value: 'Like', label: 'Contains', format: ({ field, value }) => `${field} ⊃ ${value}` },
  Ilike: {
    value: 'Ilike',
    label: 'Not Contains',
    format: ({ field, value }) => `${field} ⊅ ${value}`
  },
  Range: {
    value: 'Range',
    label: 'Between',
    format: ({ field, begin, end }) => `${begin} ≤ ${field} ≤ ${end}`
  },
  Lt: { value: 'Lt', label: 'Less Than', format: ({ field, value }) => `${field} < ${value}` },
  Lte: {
    value: 'Lte',
    label: 'Less Than or Equal',
    format: ({ field, value }) => `${field} ≤ ${value}`
  },
  Gt: { value: 'Gt', label: 'Greater Than', format: ({ field, value }) => `${field} > ${value}` },
  Gte: {
    value: 'Gte',
    label: 'Greater Than or Equal',
    format: ({ field, value }) => `${field} ≥ ${value}`
  }
}

const MostRelevantFields = {
  httpMetrics: ['Domain', 'Status', 'Upstream Status', 'Upstream Cache Status', 'Request Time'],
  l2CacheMetrics: [
    'Upstream Bytes Received',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  edgeFunctionsMetrics: [
    'Domain',
    'Edge Function Id',
    'Compute Time',
    'Invocations',
    'Edge Functions Instance Id List'
  ],
  imagesProcessedMetrics: [
    'Domain',
    'Status',
    'Upstream Status',
    'Upstream Cache Status',
    'Request Time'
  ],
  idnsQueriesMetrics: ['Qtype', 'Requests', 'Source Loc Pop', 'Zone Id'],
  dataStreamedMetrics: ['Domain', 'Status', 'Data Streamed', 'Endpoint Type', 'Requests']
}

/**
 * Retrieves the operator from the given operator name.
 *
 * @param {string} operator - The operator name to retrieve the operator from.
 * @return {string} The retrieved operator.
 */
export const getOperatorFromOperatorName = (operator) => operators[operator]

/**
 * Returns the operator corresponding to the given field name.
 *
 * @param {string} fieldName - The name of the field to extract the operator from.
 * @return {type} The corresponding operator from operators.
 */
export const getOperatorFromFieldName = (fieldName) => {
  const words = fieldName.split(/(?=[A-Z])/)
  const operator = words.pop()
  return operators[operator]
}

/**
 * Check if the given field is relevant in the specified dataset.
 *
 * @param {string} fieldName - The name of the field to check.
 * @param {string} dataset - The dataset to check against.
 * @return {number} The index of the relevant field, or -1 if not relevant.
 */
export const isRelevantField = (fieldName, dataset) => {
  const fieldsRelevant = MostRelevantFields[dataset] || []
  return fieldsRelevant.indexOf(fieldName)
}
