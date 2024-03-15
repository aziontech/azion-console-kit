/**
 * Capitalizes the first letter of a given string.
 * @param {string} string - The input string.
 * @returns {string} - The input string with the first letter capitalized.
 */
export const capitalizeFirstLetter = (string) => string?.charAt(0).toUpperCase() + string?.slice(1)
