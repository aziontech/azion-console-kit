/**
 *
 * @param {string} textWithHtmlTags Your tag that contains unwanted html tags inside
 * @param {string} htmlTagToRemove ex: for link <a> tag use a, <p> use p, and so on.
 * @returns
 */

export const removeHtmlTagFromText = (textWithHtmlTags, htmlTagToRemove) => {
  const parser = new DOMParser()
  const parsedDisclaimer = parser.parseFromString(textWithHtmlTags, 'text/html')

  const linkTags = parsedDisclaimer.querySelectorAll(htmlTagToRemove)

  linkTags.forEach((linkTag) => linkTag.remove())

  const disclaimerWithoutLinks = parsedDisclaimer.body.textContent

  return disclaimerWithoutLinks
}
