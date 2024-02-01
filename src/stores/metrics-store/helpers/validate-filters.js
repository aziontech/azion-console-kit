/**
 * Check if both begin and end fields are truthy.
 *
 * @param {object} fields - the fields object
 * @return {boolean} true if both begin and end are truthy, false otherwise
 */
function isRange(fields) {
  return fields.begin && fields.end
}

/**
 * Checks if the input is a valid string.
 *
 * @param {any} field - The field to be checked
 * @return {boolean} true if the input is a valid string, false otherwise
 */
function validString(field) {
  return typeof field.value === 'string' || field.value instanceof String
}

/**
 * Checks if the input is a valid integer.
 *
 * @param {any} field - The input field to be checked.
 * @return {boolean} Returns true if the input is a valid integer, otherwise false.
 */
function validInt(field) {
  return Number.isInteger(field.value)
}

/**
 * Checks if the given field represents a valid integer range.
 *
 * @param {Object} field - the field to be checked for being a valid integer range
 * @return {boolean} true if the field is a valid integer range, otherwise false
 */
function validIntRange(field) {
  if (!isRange(field)) return false
  if (!validInt({ value: field.begin }) || !validInt({ value: field.end })) return false
  return true
}

/**
 * Checks if the input field value is a valid float.
 *
 * @param {type} field - the input field to validate
 * @return {boolean} true if the field value is a valid float, false otherwise
 */
function validFloat(field) {
  return !/^\s*$/.test(field.value) && !Number.isNaN(field.value)
}

/**
 * Checks if the given field is a valid float range.
 *
 * @param {object} field - The field to be checked for being a valid float range
 * @return {boolean} true if the field is a valid float range, false otherwise
 */
function validFloatRange(field) {
  if (!isRange(field)) return false
  if (!validFloat({ value: field.begin }) || !validFloat({ value: field.end })) return false
  return true
}

/**
 * Check if the input field is a valid boolean value.
 *
 * @param {any} field - the input field to be checked
 * @return {boolean} true if the input field is a boolean, false otherwise
 */
function validBoolean(field) {
  return typeof field.value === 'boolean'
}

/**
 * Check if the input field contains a valid date and time in the format
 * YYYY-MM-DDTHH:MM:SS.
 *
 * @param {object} field - the input field to be validated
 * @param {string} field.value - the value of the input field
 * @return {array|null} an array of matches if the input is valid, or null if
 * the input is invalid
 */
function validDateTime(field) {
  const isDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/
  return field.value.match(isDateRegex)
}

/**
 * Validates if the given field represents a valid date-time range.
 *
 * @param {Object} field - the field to be validated as a date-time range
 * @return {boolean} true if the field represents a valid date-time range, false otherwise
 */
function validDateTimeRange(field) {
  if (!isRange(field)) return false
  if (!validDateTime({ value: field.begin }) || !validDateTime({ value: field.end })) return false
  return true
}

const validate = {
  String: validString,
  Int: validInt,
  IntRange: validIntRange,
  Float: validFloat,
  FloatRange: validFloatRange,
  Boolean: validBoolean,
  DateTime: validDateTime,
  DateTimeRange: validDateTimeRange
}

/**
 * Checks if the fieldAlias exists in the availableFilters.
 *
 * @param {string} fieldAlias - The field alias to check for existence
 * @param {Array} availableFilters - The array of available filters to search
 * @return {boolean} Returns true if the fieldAlias exists, otherwise false
 */
function checkFieldExistance(fieldAlias, availableFilters) {
  return !!availableFilters.find((filter) => fieldAlias === filter.label)
}

/**
 * Validates the provided timestamp range object.
 *
 * @param {Object} tsRange - the timestamp range object to validate
 * @return {boolean} true if the timestamp range is valid, false otherwise
 */
function validateTSRange({ tsRange = false }) {
  if (!tsRange || !tsRange.begin || !tsRange.end || !tsRange.meta) return false
  const matchDateBegin = validDateTime({ value: tsRange.begin })
  const matchDateEnd = validDateTime({ value: tsRange.end })
  return !!(matchDateBegin && matchDateEnd)
}

/**
 * Validates and filters the given 'and' object using the available filters.
 *
 * @param {Object} and - The 'and' object to be validated and filtered.
 * @param {Object} availableFilters - The available filters for validation.
 * @return {Object} The filtered 'and' object.
 */
function validateAnd({ and }, availableFilters) {
  if (!and) return {}
  const filters = structuredClone(and)

  for (const andFilter in and) {
    if (andFilter === 'meta') continue
    const fieldExists = checkFieldExistance(andFilter, availableFilters)

    if (!fieldExists) return false

    const inputType = and[andFilter].meta.inputType
    const isValid = validate[inputType](and[andFilter])

    if (!isValid) delete filters[andFilter]
  }

  return filters
}

/**
 * Validates the datasets based on the available filters.
 *
 * @param {Object} datasets - the datasets to validate
 * @param {Array} availableFilters - the available filters for validation
 * @return {Array} the list of validated datasets
 */
function validateDatasets({ datasets }, availableFilters) {
  if (!datasets) return []
  const datasetList = datasets.filter((dataset) => {
    if (!dataset.fieldName || !dataset.fieldAlias) return false
    const fieldExists = checkFieldExistance(dataset.fieldName, availableFilters)

    if (!fieldExists) return false

    if (!dataset.in?.length > 0) return false
    for (const datasetIn in dataset.in) {
      if (!validInt({ value: dataset.in[datasetIn].sourceId })) return false
      if (!validString({ value: dataset.in[datasetIn].sourceName })) return false
    }
    if (!dataset.meta?.fieldPrefix) return false

    return true
  })

  return datasetList
}

/**
 * Validates the given filters based on the available filters and returns the
 * valid time series range, AND fields, and datasets fields.
 *
 * @param {Object} filters - The filters to be validated.
 * @param {Object} availableFilters - The available filters to validate against.
 * @return {Object} The valid time series range, AND fields, and datasets fields.
 */
export default function ValidateFilters(filters, availableFilters) {
  const isValidTimeSeries = validateTSRange(filters)
  const andFields = validateAnd(filters, availableFilters)
  const datasetsFields = validateDatasets(filters, availableFilters)

  return {
    tsRange: isValidTimeSeries && filters.tsRange,
    and: andFields,
    datasets: datasetsFields
  }
}
