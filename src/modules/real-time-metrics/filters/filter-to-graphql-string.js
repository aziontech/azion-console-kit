/**
 * Checks if the value should be replaced with a string in the GraphQL query.
 *
 * @param {any} value - The value to be checked.
 * @returns {boolean} - True if the value should be replaced, false otherwise.
 */
const shouldReplaceString = (value) => {
  return (value === '' || Number.isNaN(+value)) && value.charAt(0) !== '$'
}

/**
 * Check if the input is a string and does not start with '$'
 * @param {any} value - The input to be checked
 * @returns {boolean} - Returns true if the input is a string and does not start with '$', otherwise returns false
 */
function isValidString(value) {
  return typeof value === 'string' && value.charAt(0) !== '$'
}

/**
 * Generates the GraphQL string for a filter.
 *
 * @param {string} name - The name of the filter.
 * @param {any} value - The value of the filter.
 * @returns {string} - The generated GraphQL string for the filter.
 */
export default function FiltersToGraphQLString(name, value) {
  let result = `${name}: `

  if (Array.isArray(value)) {
    const listFilterValues = value.map((item) => `"${item}"`)

    result += `[${listFilterValues}]`
    return `${result}\n`
  }

  if (typeof value === 'object') {
    result += '{\n'
    Object.keys(value).forEach((key) => {
      result += FiltersToGraphQLString(key, value[key])
    })

    result += '\n}'
  } else {
    let queryValue = value
    // escape strings
    if (shouldReplaceString(value)) {
      queryValue = `"${value.replace(/^\\\$/, '$')}"`
    } else if (isValidString(value)) {
      queryValue = `"${value}"`
    }
    result += queryValue
  }
  return `${result}\n`
}
