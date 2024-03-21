const VARIABLES_BLACK_LIST = ['sum', 'count', 'avg', 'max', 'min', 'client_id']

/**
 * Sorts an object by its keys in ascending order.
 * @param {Object} unsortedObj - The unsorted object to be sorted.
 * @returns {Object} - The sorted object.
 */
const sortObjectByKey = (unsortedObj) => {
  const res = Object.keys(unsortedObj)
    .sort((prev, next) => prev.localeCompare(next))
    .reduce((obj, key) => {
      const newObj = { ...obj }
      newObj[key] = unsortedObj[key]
      return newObj
    }, {})

  return res
}

/**
 * @param {array} fields Array with the fields
 * @param {array} variablesBlacklist Array with the name of fields to be avoid
 * @returns {object} Sorted key/value with the dataset as key and their variables
 */
export default function FormatDatasetVariables(fields) {
  const dataset = {}

  fields.forEach((field) => {
    const variables = {}
    field.type.ofType.fields.forEach((variable) => {
      if (!VARIABLES_BLACK_LIST.includes(variable.name)) {
        variables[variable.name] = { name: variable.name, type: variable.type.name }
      }
    })

    dataset[field.name] = sortObjectByKey(variables)
  })

  return dataset
}
