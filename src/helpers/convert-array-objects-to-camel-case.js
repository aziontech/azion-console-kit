import { parseSnakeToCamel } from './parse-api-body'

/**
 * Converts all properties of an array of objects from snake_case to camelCase, including nested objects
 * @param {Array<Object>} arrayOfObjects - Array containing objects with properties in snake_case
 * @returns {Array<Object>} - New array with objects containing properties in camelCase
 */
export const convertArrayObjectsToCamelCase = (arrayOfObjects) => {
  return arrayOfObjects.map((object) => {
    const convertedObject = {}
    for (const key in object) {
      const camelKey = key.replace(/_([a-z])/g, (match) => match[1].toUpperCase())
      convertedObject[camelKey] =
        typeof object[key] === 'object' && object[key] !== null
          ? Array.isArray(object[key])
            ? convertArrayObjectsToCamelCase(object[key])
            : parseSnakeToCamel(object[key])
          : object[key]
    }
    return convertedObject
  })
}
