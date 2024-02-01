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
 * Generates JSDoc for the FiltersToGraphQLString function.
 *
 * @param {string} name - The name of the filter.
 * @param {any} value - The value of the filter.
 * @returns {string} - The generated GraphQL string for the filter.
 */
function FiltersToGraphQLString(name, value) {
  let result = `${name}: `
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
    }
    result += queryValue
  }
  return `${result}\n`
}

export default FiltersToGraphQLString
