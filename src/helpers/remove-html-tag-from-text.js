/**
 * Strips the given tag from an HTML string and returns the plain-text result.
 *
 * Uses DOMParser (the safe-by-design HTML parser — scripts are not executed) to remove
 * the requested tag, then returns `.body.textContent` so only inert text leaves the function.
 *
 * @param {string} source HTML string that may contain unwanted tags
 * @param {string} tagSelector CSS selector for the tag(s) to strip (e.g. `'a'`, `'p'`)
 * @returns {string} Plain text with the targeted tags removed
 */

export const removeHtmlTagFromText = (source, tagSelector) => {
  const parser = new DOMParser()
  const parsed = parser.parseFromString(source, 'text/html')

  const matchedNodes = parsed.querySelectorAll(tagSelector)
  matchedNodes.forEach((node) => node.remove())

  return parsed.body.textContent
}
