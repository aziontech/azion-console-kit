/**
 * Formats a given string by capitalizing the first letter of each word and removing underscores.
 *
 * @param {string} inputString - The string to be formatted.
 * @returns {string} The formatted string example: "edge_certificate" -> "Edge Certificate".
 */
export const formatString = (inputString) => {
  if (typeof inputString !== 'string' || inputString.trim() === '') {
    return ''
  }

  const formattedString = inputString
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => {
      if (word.length === 0) {
        return ''
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')

  return formattedString
}
